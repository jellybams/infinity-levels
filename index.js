var inputFile = './sample.log';

var async = require('async');
var fs = require('fs');
var logfmt = require('logfmt');
var through = require('through');
var stats = require('./lib/Stats');

console.log('Parsing ' + inputFile + '...\n\n');

fs.createReadStream(inputFile)
  .pipe(logfmt.streamParser())
  .pipe(through(function tracker(logObj) {
    stats.track(logObj);
  }))
  .on('end', function() {
    stats.calculate();
    stats.show();
  });
