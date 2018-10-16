/**
 * @author Benjamin Assadsolimani
 * Example configuration module using the flex_conf package to implement a simple environment-based configuration file loading
 */

'use strict';

const path = require('path');
const FlexConf = require('../lib/flex-conf');

const conf = new FlexConf(path.join(__dirname, 'configs'), {
  tagDefinitions: {
    env: {
      applies: value => process.env.NODE_ENV === value,
      map: (value) => {
        switch (value) {
          case 'dev': return 'development';
          case 'prod': return 'production';
          case 'test': return 'test';
          default: throw Error(`Unknown NODE_ENV in configfile name: '${value}'`);
        }
      },
    },
  },
});

module.exports = conf.final();
