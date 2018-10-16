/**
 * @author Benjamin Assadsolimani
 * flex_conf - flexible configuration file loading.
 */

'use strict';

const debug = require('debug')('flex_conf');
const nconf = require('nconf');
const ConfigFile = require('./config-file');
const TagDefinition = require('./tag-definition');
const { getFilesFromDir } = require('./utils');

/**
 * FlexConf class, representing the entire config of the config folder
 */
class FlexConf {
  /**
   * Create a new configuration instance.
   * @param {string} configFolder - Path to the folder that holds all configuration files.
   * @param {Object} options - Configuration options.
   * @param {Object} [options.tagDefinitions={}] - Tag definitions.
   * @param {boolean} [options.loadRecursive=true] - Whether to load sub-folders of the configuration folder recursively.
   * @param {boolean} [options.folderTags=true] - Whether to parse sub-folder names as tags if applicable.
   * @param {boolean} [options.parseArgv=true] - Whether to parse command line arguments.
   * @param {boolean} [options.parseEnv=true] - Whether to parse environment variables.
   * @param {string} [options.separator='__'] - Seperator for environment variables.
   * @param {string} [options.postfix='json'] - Seperator for environment variables.
   * @param {boolean} [options.lowerCase=true] - Whether to lower-case environment variables.
   * @param {boolean} [options.autoload=true] - Whether to automatically load all configuration files on instantiation.
   */
  constructor(configFolder, options = {}) {
    // Filesystem options
    this.configFolder = configFolder;
    this.loadRecursive = options.loadRecursive !== undefined ? options.loadRecursive : true;
    this.folderTags = options.folderTags !== undefined ? options.folderTags : true;
    this.postfix = options.postfix || 'json';

    // Input sources options
    this.parseArgv = options.parseArgv !== undefined ? options.parseArgv : true;
    this.parseEnv = options.parseEnv !== undefined ? options.parseEnv : true;
    this.autoload = options.autoload !== undefined ? options.autoload : true;

    // Environment variable parsing options
    this.separator = options.separator || '__';
    this.lowerCase = options.lowerCase !== undefined ? options.lowerCase : true;

    // Instantiate tag definitions
    this.tagDefinitions = {};
    Object.keys(options.tagDefinitions || {}).forEach((tagName) => {
      this.tagDefinitions[tagName] = new TagDefinition(tagName, options.tagDefinitions[tagName]);
    });

    this.configFiles = [];

    // Create a new nconf configuration store
    this.store = new nconf.Provider();
    if (this.parseArgv) { this.store.argv(); }
    if (this.parseEnv) {
      this.store.env({
        separator: this.separator,
        lowerCase: this.lowerCase,
      });
    }

    // Load configuration files
    if (this.autoload) {
      this.loadConfigFiles();
    }
  }

  /**
   * Load all configuration files inside the root config folder and it's sub-folders if loadRecursive is activated.
   */
  loadConfigFiles() {
    // Get all config files
    const filenames = getFilesFromDir(this.configFolder, this.postfix, this.loadRecursive);
    filenames.forEach((filename) => {
      const configFile = new ConfigFile(filename, {
        tagDefinitions: this.tagDefinitions,
        configFolder: this.configFolder,
        folderTags: this.folderTags,
      });

      debug(`Processing config file: ${configFile.toString()}`);
      configFile.processFilepath(this.tagDefinitions);
      this.configFiles.push(configFile);
    });

    // Filter config files by tag values
    this.configFiles = this.configFiles.filter((configFile) => {
      return Object.keys(configFile.tags).reduce((ret, key) => {
        const value = configFile.tags[key];
        const { applies } = this.tagDefinitions[key];
        if (!applies(value)) {
          return false;
        }
        return ret && true;
      }, true);
    });

    // Sort config files by score
    this.configFiles = this.configFiles.sort((file1, file2) => file2.score - file1.score);

    this.configFiles.forEach((configFile) => {
      // Load config files in nconf store
      const json = configFile.loadJson();
      const store = {};
      store[configFile.namespace] = json;
      this.store.add(configFile.filepath, {
        type: 'literal',
        store,
      });
      debug(`Loaded configuration file ${configFile.toString()}`);
    });
  }

  /**
   * Return a final configuration object.
   */
  final() {
    return this.store.get();
  }
}

module.exports = FlexConf;
