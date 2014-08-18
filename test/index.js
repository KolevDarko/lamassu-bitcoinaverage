'use strict';

var should        = require('chai').should();

var pluginConfig  = require('../config');


// Checks structure and values of object returned by `.balance()`
function checkCurrency(results, currency) {
  results.should.be.an('object');
  results.should.have.property(currency);

  var curr = results[currency];
  curr.should.be.an('object');
  curr.should.have.property('currency');
  curr.currency.should.equal(currency);

  curr.should.have.property('rates');

  var rates = curr['rates'];
  rates.should.be.an('object');

  rates.should.have.property('ask');
  var askRate = parseFloat(rates.ask);
  isNaN(askRate).should.not.equal(true, 'The ask rate should be a float');

  // rates.should.have.property('bid');
  var bidRate = parseFloat(rates.bid);
  isNaN(bidRate).should.not.equal(true, 'The bid rate should be a float');

  return rates;
};

// from list of supported currencies, randomly pick two
function pick2RandomCurrencies(currencies) {
  if (currencies.length <= 2)
    return currencies;

  var picked = [];
  var index = Math.floor(Math.random() * currencies.length);
  picked.push(currencies[index]);

  var index2 = NaN;
  do {
    index2 = Math.floor(Math.random() * currencies.length);

  } while (index === index2);
  picked.push(currencies[index2]);

  return picked;
};

// only test if ticker is declared to be working
if(pluginConfig.supports('ticker')) {
  describe(pluginConfig.NAME + ' Ticker', function() {
    var tickerPlugin = require('../index');

    // // NOTE: should be uncommented and adjusted when rate limiting is in place
    // afterEach(function(done) {
    //   setTimeout(done, 1000);
    // });

    // NOTE: MAX timeout for each test
    this.timeout(2000);

    // picks random 2 *supported* currencies
    var testedCurrencies = pick2RandomCurrencies(tickerPlugin.SUPPORTED_CURRENCIES);

    // single supported currency fetch (as string)
    it('should read ticker in \'' + testedCurrencies[0] + '\'', function(done) {
      tickerPlugin.ticker(testedCurrencies[0], function(err, results) {
        should.not.exist(err, "There should be no error");
        should.exist(results);

        checkCurrency(results, testedCurrencies[0]);

        done();
      });
    });

    // single supported currency fetch (as array)
    it('should read ticker in [' + testedCurrencies[1] + ']', function(done) {
      tickerPlugin.ticker([testedCurrencies[1]], function(err, results) {
        should.not.exist(err, "There should be no error");
        should.exist(results);

        checkCurrency(results, testedCurrencies[1]);

        done();
      });
    });


    // will be used in following tests
    var unsupportedCurrency = 'ABC';

    // single *not* supported currency fetch
    it('should fail to read ticker in ' + unsupportedCurrency, function(done) {
      tickerPlugin.ticker([unsupportedCurrency], function(err, results) {
        should.exist(err);
        should.not.exist(results);

        done();
      });
    });


    // multiple supported currencies fetch
    it('should read ticker in ' + testedCurrencies.join(', '), function(done) {

      tickerPlugin.ticker(testedCurrencies, function(err, results) {
        should.not.exist(err, "There should be no error");
        should.exist(results);

        for(var i in testedCurrencies)
          checkCurrency(results, testedCurrencies[i]);

        done();
      });
    });


    // multiple supported AND not supported currencies
    var mixCurrencies = [testedCurrencies[0], unsupportedCurrency];
    it('should fail to read ticker with ' + mixCurrencies.join(', '), function(done) {
      tickerPlugin.ticker(mixCurrencies, function(err, results) {
        should.exist(err);
        should.not.exist(results);

        done();
      });
    });


    // multiple supported and not supported currencies
    var mix2Currencies = [unsupportedCurrency].concat(testedCurrencies);
    it('should fail to read ticker in ' + mix2Currencies.join(', '), function(done) {
      tickerPlugin.ticker(mix2Currencies, function(err, results) {
        should.exist(err);
        should.not.exist(results);

        done();
      });
    });

    // ticker request with empty array
    var emptyArray = [];
    it('should fail to read ticker with empty array', function(done) {
      tickerPlugin.ticker(emptyArray, function(err, results) {
        should.exist(err);
        should.not.exist(results);

        done();
      });
    });

  });
}
