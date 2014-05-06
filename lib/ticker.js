'use strict';

var async = require('async');
var jsonquest = require('jsonquest');

var BitcoinAverageTicker = function(config) {
  this.config = config;
};

BitcoinAverageTicker.factory = function factory(config) {
  return new BitcoinAverageTicker(config);
};

function fetchTicker(currency, cb) {
  jsonquest({
    host: 'api.bitcoinaverage.com',
    path: '/ticker/global/' + currency + '/',
    method: 'GET',
    protocol: 'https'
  }, function (err, response, result) {
    if (err) return cb(err);
    var rate = null;
    try {
      rate = result.ask;
    } catch (ex) {
      return cb(new Error('Could not parse BitcoinAverage ticker response.'));
    }
    cb(null, {currency: currency, rate: rate});
  });
}

// Note: BitcoinAverage is rate limited. Don't call more often than once 
// a minute or an error will result.
BitcoinAverageTicker.prototype.ticker = function ticker(currencies, cb) {
  async.map(currencies, fetchTicker, function (err, results) {
    if (err) return cb(err);
    return cb(null, results);
  });
};

module.exports = BitcoinAverageTicker;
