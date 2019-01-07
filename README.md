# flex_conf

[![](https://img.shields.io/badge/TypeScript-v3-blue.svg?style=flat)](https://github.com/decentro-gmbh/flex_conf/blob/master/package.json
) [![](https://img.shields.io/npm/v/flex_conf.svg)](https://www.npmjs.com/package/flex_conf
) [![](https://img.shields.io/snyk/vulnerabilities/npm/flex_conf.svg)](https://snyk.io/test/npm/flex_conf
) [![](https://img.shields.io/github/license/decentro-gmbh/flex_conf.svg?style=flat)](https://github.com/decentro-gmbh/flex_conf/blob/master/LICENSE)

Flexible configuration file management.

Based on the [nconf](https://www.npmjs.com/package/nconf) package, the flex_conf package provides tag-based, hierarchical configuration file loading with atomic object merging. It is possible to register one or more "tags" e.g., `env` for environment-specific configuration files. These tags can then be used inside the configuration file's filename and/ or in folder names to conditionally load the configuration file.

# Installation

Installation is straight forward with npm:
```
npm install flex_conf
```

# Example

A minimal config module using `flex_conf` looks like this:

``` js
# config.js
const FlexConf = require('flex_conf');

const conf = new FlexConf('configs', {
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
```

We can now create various configuration files inside the `configs/` directory that will be parsed based on the value of the `NODE_ENV` environment variable:

```
configs/
├── database.env-dev.json
├── database.env-prod.json
└── database.json
```

For example, `NODE_ENV=development` would result in the `database.env-dev.json` file being loaded first, followed by the `database.json` as it is unconditionally loaded in any case (as no tags are specified).

To access the final configuration object in another module, we simply require the config module:
``` js
# example.js
const config = require('./config');

function connect() {
  console.log(`Connection to database '${config.database.username}@${config.database.host}:${config.database.port}'`);
}

connect();
```

**Note:** This example is also included in the GitHub repository under `example/`.

# API Documentation

The API documentation can be found here: https://decentro-gmbh.github.io/flex_conf/
