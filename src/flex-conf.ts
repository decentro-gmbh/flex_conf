/**
 * @author Benjamin Assadsolimani
 * flex_conf - flexible configuration file loading.
 */

'use strict';

import * as debug from 'debug';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as nconf from 'nconf';
import { ConfigFile } from './config-file'
import { TagDefinition } from './tag-definition'
import { getFilesFromDir } from './utils'

/**
 * FlexConf class, representing the entire config of the config folder
 */
export class FlexConf {
  configFolder: string;
  loadRecursive: boolean;
  folderTags: boolean;
  postfix: string;
  parseArgv: boolean;  
  parseEnv: boolean;
  autoload: boolean;
  separator: string;
  lowerCase: boolean;
  parseValues: boolean;
  tagDefinitions: Object;
  configFiles: Array<any>;
  store: any;

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
   * @param {boolean} [options.parseValues=false] - Attempt to parse well-known values (e.g. 'false', 'true', 'null', 'undefined', '3', '5.1' and JSON values) into their proper types. If a value cannot be parsed, it will remain a string.
   * @param {boolean} [options.autoload=true] - Whether to automatically load all configuration files on instantiation.
   */
  constructor(configFolder: string, options: any = {}) {
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
    this.parseValues = options.parseValues !== undefined ? options.parseValues : false;

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
        parseValues: this.parseValues,
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
   * Save a config namespace to a file.
   * @param {string} namespace - Config namespace to save to a file.
   * @param {Object} [options={}] - Options object.
   * @param {string} [options.filepath] - Path to save the config file to, defaults to "[os.tmpdir()]/[namespace].json".
   * @param {string|number} [options.space] - A String or Number object that's used to insert white space into the output JSON string for readability purposes.
   * @param {string} [options.encoding="utf8"] - File encoding, default to "utf8".
   * @param {string} [options.flag="w"] - Write operation flags, defaults to "w".
   * @param {number} [options.mode=0o600] - File permissions, default to read-only for the owner.
   * @returns {string} Path of the saved config file.
   */
  saveToFile(namespace, options: any = {}) {
    const configObject = this.store.get(namespace);
    if (!options.filepath) {
      options.filepath = path.join(os.tmpdir(), `${namespace}.json`);
    }
    fs.writeFileSync(options.filepath, JSON.stringify(configObject, null, options.space), {
      encoding: options.encoding || 'utf8',
      flag: options.flag || 'w',
    });
    fs.chmodSync(options.filepath, options.mode || 0o600);

    return options.filepath;
  }

  /**
   * Return a final configuration object.
   */
  final() {
    return this.store.get();
  }
}
