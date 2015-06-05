var after = require('./helpers').after;
var analyzer = require('./Analyzer');
var Table = require('cli-table');

/**
 * Stats class provides methods for aggregating log
 * results, running analysis and visualizing data in console.
 */
var Stats = function Stats() {
  /**
   * regex to use for picking out requests of interest
   * 
   * @type {RegExp}
   */
  this.endpointRegex = /\/api\/users\/(\d+)(\/count_pending_messages|get_messages|get_friends_progress|get_friends_score)?/;

  /**
   * keeps track of what requests (method + url) we want stats for
   * 
   * @type {Array}
   */
  this.trackedReqs = [
    'GET::/api/users/{user_id}/count_pending_messages',
    'GET::/api/users/{user_id}/get_messages',
    'GET::/api/users/{user_id}/get_friends_progress',
    'GET::/api/users/{user_id}/get_friends_score',
    'POST::/api/users/{user_id}',
    'GET::/api/users/{user_id}'
  ];

  /**
   * struct to hold data about each endpoint of interest, for example:
   *
   * {
   *   'GET::/api/users/{user_id}': {
   *     hits: 234,
   *     responseTimes: [10, 39, 45],
   *     responseAnalysis: {
   *       mean: 31.333333,
   *       median: 39,
   *       mode: null
   *     },
   *     dynoCounts: {
   *       'web.6': 3,
   *       'web.4': 24
   *     },
   *     maxDyno: {
   *      name: 'web.4',
   *      count: 453
   *     }
   *   },
   *   ...
   * }
   * 
   * @type {Object}
   */
  this.endpointStats = {};

  /**
   * flag to indicate new endpoint data has been
   * added since the last time this.calculate() was run
   * 
   * @type {Boolean}
   */
  this.dirty = false;

  /**
   * flag to indicate analysis has run
   * 
   * @type {Boolean}
   */
  this.calculated = false;
};

/**
 * adds data about a log line/obj to aggregate struct
 * 
 * @param  {Object}  logObj  Contains logfmt parsed object representing a log line
 */
Stats.prototype.track = function track(logObj) {
  var regexRes = this.endpointRegex.exec(logObj.path);
  
  if(!regexRes) {
    return;
  }

  var statsKey = logObj.method + '::' + regexRes.input.replace(regexRes[1], '{user_id}');

  if(this.trackedReqs.indexOf(statsKey) === -1) {
    return;
  }
    
  var connTime = parseInt(logObj.connect.substr(0, logObj.connect.length-2));
  var serviceTime = parseInt(logObj.service.substr(0, logObj.service.length-2));

  if(this.endpointStats.hasOwnProperty(statsKey)) {
    this.endpointStats[statsKey].hits++;
    this.endpointStats[statsKey].responseTimes.push(connTime + serviceTime);
  }
  else {
    this.endpointStats[statsKey] = {
      hits: 1,
      responseTimes: [connTime + serviceTime],
      dynoCounts: {}
    };
  }

  if(this.endpointStats[statsKey].dynoCounts.hasOwnProperty(logObj.dyno)) {
    this.endpointStats[statsKey].dynoCounts[logObj.dyno]++;
  }
  else {
    this.endpointStats[statsKey].dynoCounts[logObj.dyno] = 1;
  }

  this.dirty = true;
};


/**
 * runs analysis on aggregated log data, must be run before Stats.show()
 *
 * adds the following keys to each key of this.endpointStats:
 *   - responseAnalysis
 *   - maxDyno
 */
Stats.prototype.calculate = function calcute() {
  var _this = this;
  
  Object.keys(this.endpointStats).forEach(function(key) {
    _this.endpointStats[key].responseAnalysis = analyzer.responseTimes(
      _this.endpointStats[key].responseTimes,
      _this.endpointStats[key].hits);

    _this.endpointStats[key].maxDyno = analyzer.maxDyno(_this.endpointStats[key].dynoCounts);
  });

  _this.dirty = false;
  _this.calculated = true;
};

/**
 * outputs tabular data to console, Stats.calculate() must be run first
 */
Stats.prototype.show = function show() {
  if(!this.calculated) {
    throw new Error('Stats.calculate() must be run before invoking Stats.show()');
  }

  if(this.dirty) {
    console.log();
    console.log('New data has been tracked, results shown may be stale. Consider re-running Stats.calculate()');
    console.log();
  }

  var _this = this;
  
  Object.keys(this.endpointStats).forEach(function(key) {
    var table = new Table({
      head: ['Hits', 'Res. Mean', 'Res. median', 'Res. Mode', 'Max Dyno', 'Dyno Hits']
    });

    var mode = '-';
    if(_this.endpointStats[key].responseAnalysis.mode) {
      mode = _this.endpointStats[key].responseAnalysis.mode.toString();
    }

    var mean  = '-';
    if(_this.endpointStats[key].responseAnalysis.mean) {
      mean = _this.endpointStats[key].responseAnalysis.mean.toFixed(3);
    }

    table.push([
      _this.endpointStats[key].hits,
      mean,
      _this.endpointStats[key].responseAnalysis.median || '-',
      mode,
      _this.endpointStats[key].maxDyno.name || '-',
      _this.endpointStats[key].maxDyno.count || '-',
    ]);

    // position 0 holds the method
    // position 1 holds the endpoint url
    var httpReq = key.split('::');

    console.log(httpReq[0] + ' ' + httpReq[1]);
    console.log(table.toString());
    console.log();
    console.log();
  });
};

module.exports = new Stats();
