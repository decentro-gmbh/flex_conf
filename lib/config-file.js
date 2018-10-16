/**
 * @author Benjamin Assadsolimani
 * Configuration file
 */

'use strict';

const debug = require('debug')('flex_conf');
const path = require('path');
const fs = require('fs');

/**
 * Configuration file class, representing a single configuration file inside the configuration folder or one of its sub-folders.
 */
class ConfigFile {
  /**
   * Create a new configuration file.
   * @param {string} filepath - Path to the configuration file.
   * @param {Object} options - Options object.
   * @param {string} [options.configFolder=null] - Configuration files folder.
   * @param {boolean} [options.folderTags=true] - Whether to parse sub-folder names as tags if applicable.
   * @param {Object} [options.tagDefinitions={}] - Tag definitions.
   * @param {string} [options.tagSeparator='.'] - Seperation character for tags inside the filename.
   * @param {string} [options.keyValSeparator='-'] - Seperation character for a tag's key and value.
   */
  constructor(filepath, options = {}) {
    this.filepath = filepath;
    this.configFolder = options.configFolder;
    this.folderTags = options.folderTags;
    this.tagDefinitions = options.tagDefinitions || {};

    // Options
    this.tagSeparator = options.tagSeparator || '.';
    this.keyValSeparator = options.keyValSeparator || '-';

    // Process filepath
    this.tags = {};
    this.namespace = null;
  }

  get filename() { return path.basename(this.filepath); }

  get numTags() { return Object.keys(this.tags).length; }

  toString() { return `<${this.score}> ${this.filepath}`; }

  get score() {
    let score = 0;
    Object.keys(this.tags).forEach((key) => {
      const value = this.tags[key];
      score += this.tagDefinitions[key].score(value);
    });
    return score;
  }

  /**
   * Get an array of folder names of the config file's path. Treat the config folder as the root folder such that only folders will
   * be listed that are sub-folders of the root config folder.
   * @param {string} configFolder - Config folder path.
   * @returns {Array<string>} Array of folder names.
   */
  getFolders(configFolder) {
    return path.dirname(this.filepath)
      .substr(configFolder.length + 1)
      .split(path.sep)
      .filter(d => d.length > 0);
  }

  /**
   * Process the path and filename of the configuration file regarding to the contained tags.
   * @param {Object} tagDefinitions - An object containing all tag definitions that should be considered.
   */
  processFilepath(tagDefinitions) {
    const filetags = this.filename.split(this.tagSeparator);
    // Remove the file ending as this is not a tag
    filetags.pop();
    // The first tag is the name of the configuration file namespace
    this.namespace = filetags.shift();

    if (this.folderTags && this.configFolder) {
      // Each folder within the config directory is treated a filetag
      const folders = this.getFolders(this.configFolder);
      filetags.push(...folders);
    }

    filetags.forEach((filetag) => {
      const [key] = filetag.split(this.keyValSeparator);
      const value = filetag.substr(key.length + this.keyValSeparator.length);
      if (tagDefinitions[key]) {
        this.tags[key] = tagDefinitions[key].map(value);
        debug(`Extracted tag: <${key} : ${value} => ${this.tags[key]}> from filetag ${filetag}`);
      }
    });
  }

  /**
   * Load the JSON object contained by the configuration file.
   */
  loadJson() {
    try {
      const data = fs.readFileSync(this.filepath, 'utf8');
      try {
        const json = JSON.parse(data);
        return json;
      } catch (err) {
        throw new Error(`Could not parse JSON of config file ${this.filepath}:\n${err}`);
      }
    } catch (err) {
      throw new Error(`Could not read config file '${this.filepath}':\n${err}`);
    }
  }
}

module.exports = ConfigFile;
