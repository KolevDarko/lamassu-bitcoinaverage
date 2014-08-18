'use strict';

var _       = require('lodash');

var config  = require('./config');

_.merge(exports, config, true);


var moduleDefinitions = {
  ticker: {
    methods: [ 'ticker' ]
  },
  trader: {
    methods: [ 'purchase', 'sell' ],
    depends: [ 'common' ]
  },
  common: {
    methods: [ 'balance' ]
  },
  wallet: {
    methods: [ 'sendBitcoins' ],
    depends: [ 'common' ]
  }
};


function verifyModuleConsistency(moduleName) {
  try {
    var module = require('./lib/' + moduleName);

    var moduleDefinition = moduleDefinitions[moduleName];

    moduleDefinition.methods.forEach(function(methodName) {
      if (typeof module[methodName] !== 'function')
        throw new Error('`' + methodName + '` method not implemented');

      exports[methodName] = module[methodName];
    });

    if (moduleDefinition.hasOwnProperty('depends'))
      moduleDefinition.depends.forEach(verifyModuleConsistency);

  } catch(e) {
    throw new Error('Problem loading `' + moduleName + '`: (' + e.message + ')');
  }

};


config.SUPPORTED_MODULES.forEach(verifyModuleConsistency);
