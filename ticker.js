'use strict';

var _       = require('lodash');
var Wreck   = require('wreck');
var async   = require('async');
var crypto  = require('crypto-js');

exports.NAME = 'Bitcoinaverage';
exports.SUPPORTED_MODULES = ['ticker'];
var APIV2_ENDPOINT = 'https://apiv2.bitcoinaverage.com/';
//Generate your own api key and api secret for free from https://bitcoinaverage.com/en/apikeys
var API_KEY = 'ZGUyZTQ3NTJiNDQ5NDkzM2I4YTRjNjE2YTY1Y2Y0ZjE';
var API_SECRET = 'NDg4OGFlNzVlYWUzNGUwM2E0MzRjNTE4NDkwOTEwZThhMmM1NTU1YmEzNjg0Yjc5YmU5Y2EzZWZlYjZlYzg5YQ';
var pluginConfig = {};


exports.config = function config(localConfig) {
  if (localConfig) _.merge(pluginConfig, localConfig);
};

function btcCurrency(currency) {
  return 'BTC' + currency;
}

function getTickerUrls(currencies) {
  var suffix = currencies.length === 1 ? btcCurrency(currencies[0]) : 'all';
  var urls = [
    APIV2_ENDPOINT + 'indices/global/ticker/' + suffix
  ];

  return urls;
}

function formatResponse(currencies, results, callback) {

  results = results[0]; // always only one request

  var out = {};

  function addCurrency(currency, result) {
    if (typeof result === 'undefined')
      return;

    out[currency] = {
      currency: currency,
      rates: {
        ask: result.ask,
        bid: result.bid
      }
    };
  }

  if (currencies.length === 1)
    addCurrency(currencies[0], results);

  else
    currencies.forEach(function(currency) {
      addCurrency(currency, results[btcCurrency(currency)]);
    });

  if (currencies.length !== Object.keys(out).length)
    return callback(new Error('Unsupported currency'));


  callback(null, out);
}

function authHeader(){
  if(!(API_KEY && API_SECRET)){
    return {};
  }
  var timestamp = Math.floor(Date.now() / 1000);
  var payload = timestamp + '.' + API_KEY;
  var hash = crypto.HmacSHA256(payload, API_SECRET);
  var hex_hash = crypto.enc.Hex.stringify(hash);
  return {'X-Signature': payload + '.' + hex_hash};
}

exports.ticker = function ticker(currencies, callback) {
  if (typeof currencies === 'string')
    currencies = [currencies];

  if(currencies.length === 0)
    return callback(new Error('Currency not specified'));

  var urls = getTickerUrls(currencies);

  // change each url on the list into a download job
  var downloadList = urls.map(function(url) {
    return function(cb) {
      Wreck.get(url, {json: true, headers: authHeader()}, function(err, res, payload) {
        if (res.statusCode === 400)
          return cb(new Error('Unsupported currency'));

        cb(err, payload);
      });
    };
  });

  async.parallel(downloadList, function(err, results) {
    if (err) return callback(err);

    formatResponse(currencies, results, callback);
  });
};

