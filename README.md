# flex_conf

Flexible configuration file management.

Based on the [nconf](https://www.npmjs.com/package/nconf) package, the flex_conf package provides tag-based, hierarchical configuration file loading with atomic object merging. It is possible to register one or more "tags" e.g., `env` for environment-specific configuration files. These tags can then be used inside the configuration file's filename and/ or in folder names to conditionally load the configuration file.

# Installation

Installation is straight forward with npm:
```
npm install flex_conf
```

# Example

``` js
const FlexConf = require('flex-conf');

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

<a name="FlexConf"></a>

# API Documentation

<dl>
<dt><a href="#FlexConf">FlexConf</a></dt>
<dd><p>FlexConf class, representing the entire config of the config folder</p>
</dd>
<dt><a href="#TagDefinition">TagDefinition</a></dt>
<dd></dd>
</dl>

<a name="FlexConf"></a>

## FlexConf
FlexConf class, representing the entire config of the config folder

**Kind**: global class

* [FlexConf](#FlexConf)
    * [new FlexConf(configFolder, options)](#new_FlexConf_new)
    * [.loadConfigFiles()](#FlexConf+loadConfigFiles)
    * [.final()](#FlexConf+final)

<a name="new_FlexConf_new"></a>

### new FlexConf(configFolder, options)
Create a new configuration instance.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| configFolder | <code>string</code> |  | Path to the folder that holds all configuration files. |
| options | <code>Object</code> |  | Configuration options. |
| [options.tagDefinitions] | <code>Object</code> | <code>{}</code> | Tag definitions. |
| [options.loadRecursive] | <code>boolean</code> | <code>true</code> | Whether to load sub-folders of the configuration folder recursively. |
| [options.folderTags] | <code>boolean</code> | <code>true</code> | Whether to parse sub-folder names as tags if applicable. |
| [options.parseArgv] | <code>boolean</code> | <code>true</code> | Whether to parse command line arguments. |
| [options.parseEnv] | <code>boolean</code> | <code>true</code> | Whether to parse environment variables. |
| [options.separator] | <code>string</code> | <code>&quot;&#x27;__&#x27;&quot;</code> | Seperator for environment variables. |
| [options.postfix] | <code>string</code> | <code>&quot;&#x27;json&#x27;&quot;</code> | Seperator for environment variables. |
| [options.lowerCase] | <code>boolean</code> | <code>true</code> | Whether to lower-case environment variables. |
| [options.autoload] | <code>boolean</code> | <code>true</code> | Whether to automatically load all configuration files on instantiation. |

<a name="FlexConf+loadConfigFiles"></a>

### flexConf.loadConfigFiles()
Load all configuration files inside the root config folder and it's sub-folders if loadRecursive is activated.

**Kind**: instance method of [<code>FlexConf</code>](#FlexConf)
<a name="FlexConf+final"></a>

### flexConf.final()
Return a final configuration object.

**Kind**: instance method of [<code>FlexConf</code>](#FlexConf)
<a name="TagDefinition"></a>

## TagDefinition
**Kind**: global class
<a name="new_TagDefinition_new"></a>

### new TagDefinition(name, options)
Create a new TagDefinition instance.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the tag. |
| options | <code>Object</code> | Tag options. |
| [options.applies] | <code>function</code> | Function to check whether the tag value applies -> the configuration file is loaded. |
| [options.map] | <code>function</code> | Function to transform a tag value before further processing it. |
| [options.score] | <code>function</code> | Function to compute a score value for the tag. |
