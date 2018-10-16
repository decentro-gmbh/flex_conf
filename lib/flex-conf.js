/**
 * @author Benjamin Assadsolimani
 * flex_conf - flexible configuration file loading.
 */

'use strict';

const debug = require('debug')('flex_conf');
const path = require('path');
const fs = require('fs');
const nconf = require('nconf');
const ConfigFile = require('./config-file');

/**
 * Get all <filetype> files from a directory and all its sub-directories.
 * @param {string} dirpath - Directory path (relative or absolute).
 * @param {string} filetype - Filetype that should be considered.
 * @param {boolean} recursive - Whether to get files from sub-directories.
 * @returns {Array<string>} Array of paths of the found '.<filetype>' files (sorted).
 */
function getFilesFromDir(dirpath, filetype = null, recursive = false) {
  // Make sure path is absolute
  dirpath = path.isAbsolute(dirpath) ? dirpath : path.join(__dirname, dirpath);

  const dirpathStat = fs.statSync(dirpath);
  let files = [];

  if (dirpathStat.isDirectory()) {
    const filenames = fs.readdirSync(dirpath);
    filenames.forEach((filename) => {
      const filepath = path.join(dirpath, filename);
      const pathstat = fs.statSync(filepath);
      if (pathstat.isDirectory()) {
        // Recursively load
        if (recursive) {
          files = files.concat(getFilesFromDir(filepath, filetype, recursive));
        }
      } else if (pathstat.isFile()) {
        files.push(filepath);
      } else {
        throw new Error(`Not a directory or file: ${filepath}`);
      }
    });
  } else {
    throw new Error(`Not a directory: ${dirpath}`);
  }

  // Only consider valid <filetype> files and return them sorted
  if (filetype) {
    files = files.filter(file => file.endsWith(`.${filetype}`));
  }
  files.sort();

  return files;
}

/**
 * Configuration class, representing the entire config of the config folder
 */
class Configuration {
  /**
   * Create a new configuration instance
   * @param {Object} options - Configuration options.
   * @param {string} [options.configFolder='config'] - Path to the folder that holds all configuration files.
   * @param {boolean} [options.loadRecursive=true] - Whether to load sub-folders of the configuration folder recursively.
   * @param {boolean} [options.folderTags=true] - Whether to parse sub-folder names as tags if applicable
   * @param {boolean} [options.parseArgv=true] - Whether to parse command line arguments.
   * @param {boolean} [options.parseEnv=true] - Whether to parse environment variables.
   * @param {string} [options.separator] - Seperator for environment variables.
   * @param {boolean} [options.lowerCase=true] - Whether to lower-case environment variables.
   * @param {Object} [options.tagDefinitions={}] - Tag definitions
   */
  constructor(options = {}) {
    // Filesystem options
    this.configFolder = options.configFolder || path.join(__dirname, 'config');
    this.loadRecursive = options.loadRecursive !== undefined ? options.loadRecursive : true;
    this.folderTags = options.folderTags !== undefined ? options.folderTags : true;

    // Input sources options
    this.parseArgv = options.parseArgv !== undefined ? options.parseArgv : true;
    this.parseEnv = options.parseEnv !== undefined ? options.parseEnv : true;

    // Environment variable parsing options
    this.separator = options.separator || '__';
    this.lowerCase = options.lowerCase !== undefined ? options.lowerCase : true;

    // Tag definitions
    this.tagDefinitions = options.tagDefinitions || {};

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
  }

  /**
   * Load all configuration files inside the root config folder and it's sub-folders if loadRecursive is activated.
   */
  loadConfigFiles() {
    // Get all config files
    const filenames = getFilesFromDir(this.configFolder, 'json', this.loadRecursive);
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
        const { env } = this.tagDefinitions[key];
        if (env) {
          if (process.env[env] !== value) {
            return false;
          }
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
}

module.exports = Configuration;
