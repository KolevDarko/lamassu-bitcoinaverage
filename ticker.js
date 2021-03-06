'use strict';

var _       = require('lodash');
var Wreck   = require('wreck');
var async   = require('async');
var crypto  = require('crypto-js');

exports.NAME = 'Bitcoinaverage';
exports.SUPPORTED_MODULES = ['ticker'];
var API_ENDPOINT = 'https://api.bitcoinaverage.com/';
var APIV2_ENDPOINT = 'https://apiv2.bitcoinaverage.com/';
//Generate your own api key and api secret for free from https://bitcoinaverage.com/en/apikeys
//You can leave API_KEY and API_SECRET empty in which case the v1 api(api.bitcoinaverage.com) will be used.
//However the v1 api will be closed soon. Check for updates on https://bitcoinaverage.com/blog.
var API_KEY = '';
var API_SECRET = '';
var pluginConfig = {};


exports.config = function config(localConfig) {
  if (localConfig) _.merge(pluginConfig, localConfig);
};

function btcCurrency(currency) {
  return 'BTC' + currency;
}

function getTickerUrls(currencies) {
  var suffix = currencies.length === 1 ? btcCurrency(currencies[0]) : 'all';
  var root_api_url = '';
  if(!(API_KEY && API_SECRET)) {
    root_api_url = API_ENDPOINT;
  }else{
    root_api_url = APIV2_ENDPOINT;
  }
  var urls = [
    root_api_url + 'indices/global/ticker/' + suffix
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
  var headers = {
    'referrer': 'lamassu'
  };
  if(API_KEY && API_SECRET) {
    var timestamp = Math.floor(Date.now() / 1000);
    var payload = timestamp + '.' + API_KEY;
    var hash = crypto.HmacSHA256(payload, API_SECRET);
    var hex_hash = crypto.enc.Hex.stringify(hash);
    headers['X-Signature'] = payload + '.' + hex_hash;
  }
  return headers;
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

