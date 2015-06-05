/**
 * Analyzer class contains methods for performing analysis
 * on response times and dyno utilization.
 */
var Analyzer = function Analyzer() {
};

/**
 * returns mean, median and mode for the response times provided
 * 
 * @param  {Array}  resTimes response times to analyze
 * @param  {Number} hits     the number of hits resulting in the response times
 * @return {Object}          contains keys for mean, median, mode
 */
Analyzer.prototype.responseTimes = function responseTimes(resTimes, hits) {
  var _this = this;
  var responseAnalysis = {
    mean: null,
    median: null,
    mode: null
  };

  resTimes.sort(function(a, b) {
    return a - b;
  });

  responseAnalysis.mean = this.calculateMean(resTimes, hits);
  responseAnalysis.median = this.calculateMedian(resTimes);
  responseAnalysis.mode = this.calculateMode(resTimes);

  return responseAnalysis;
};

/**
 * calculates mean response time
 * 
 * @param  {Array}    resTimes array of response times
 * @param  {Number}   hits     number of hits resulting in resTimes
 * @return {Number}
 */
Analyzer.prototype.calculateMean = function calculateMean(resTimes, hits) {  
  if(!resTimes.length || typeof hits !== 'number' || hits <= 0) {
    return null;
  }
  
  var total = 0;
  for(var i=0; i<resTimes.length; i++) {
    total += resTimes[i];
  }

  return total / hits;
};

/**
 * calculates median response time
 * 
 * @param  {Array}  resTimes array of response times
 * @return {Number}
 */
Analyzer.prototype.calculateMedian = function calculateMedian(resTimes) {
  if(!resTimes.length) {
    return null;
  }

  var midpoint = Math.floor(resTimes.length / 2);

  if(resTimes.length % 2) {
    var medianMean = (resTimes[midpoint-1] + resTimes[midpoint]) / 2;
    return medianMean;
  }
  else {
    return resTimes[midpoint];
  }
};

/**
 * calculates mode of response times, accounts for cases where multiple values
 * appear the same number of times (and returns all as an array)
 * 
 * @param  {Array} resTimes array of response times
 * @return {Array}          An array containing one or more elements
 */
Analyzer.prototype.calculateMode = function calculateMode(resTimes) {
  if(!resTimes.length) {
    return null;
  }

  var modeMap = {};
  var modes = [resTimes[0]];
  var maxCount = 1;

  for(var i=0; i<resTimes.length; i++) {
    if(!modeMap[resTimes[i]]) {
      modeMap[resTimes[i]] = 1;
    }
    else {
      modeMap[resTimes[i]]++;
    }

    if(modeMap[resTimes[i]] > maxCount) {
      modes = [resTimes[i]];
      maxCount = modeMap[resTimes[i]];
    }
    else if(modeMap[resTimes[i]] === maxCount && modes.indexOf(resTimes[i]) === -1) {
      modes.push(resTimes[i]);
    }
  }

  return modes;
};

/**
 * gets most commonly hit dyno
 * 
 * @param  {Object} dynoCounts k => v pairs of dyno names to number of hits
 * @return {Object}            contains keys for name and count of max dyno
 */
Analyzer.prototype.maxDyno = function responseTimes(dynoCounts) {
  var maxDyno = {
    name: null,
    count: null
  };

  var dynos = Object.keys(dynoCounts);

  for(var i=0; i<dynos.length; i++) {
    var curr = dynos[i];
    if(dynoCounts[curr] > maxDyno.count) {
      maxDyno.name = curr;
      maxDyno.count = dynoCounts[curr];
    }
  }

  return maxDyno;
};

module.exports = new Analyzer();
