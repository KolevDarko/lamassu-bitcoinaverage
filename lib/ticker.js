'use strict';

var Wreck       = require('wreck');
var async       = require('async');


// copy relevant convienient constants
var config                = require('../config');
var API_ENDPOINT          = config.API_ENDPOINT;
var SUPPORTED_CURRENCIES  = config.SUPPORTED_CURRENCIES;


function getTickerUrls(currencies) {
  var suffix = currencies.length === 1 ? currencies[0] + '/' : 'all';
  var urls = [
    API_ENDPOINT + 'ticker/global/' + suffix
  ];

  return urls;
};

function formatResponse(currencies, results, callback) {

  results = results[0]; // always only one request

  var out = {};

  function addCurrency(currency, result) {
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
      addCurrency(currency, results[currency]);
    });

  callback(null, out);
};


exports.ticker = function ticker(currencies, callback) {
  if (typeof currencies === 'string')
    currencies = [currencies];

  currencies.sort();

  if(currencies.length === 0)
    return callback(new Error('Currency not specified'));

  for (var i=0; i<currencies.length; i++)
    if (SUPPORTED_CURRENCIES.indexOf(currencies[i]) === -1)
      return callback(new Error('Unsupported currency: ' + currencies[i]));

  var urls = getTickerUrls(currencies);

  // change each url on the list into a download job
  var downloadList = urls.map(function(url) {
    return function(cb) {
      Wreck.get(url, { json:true }, function(err, res, payload) {
        cb(err, payload);
      });
    }
  });

  async.parallel(downloadList, function(err, results) {
    if (err) return callback(err);

    formatResponse(currencies, results, callback);
  });
};

