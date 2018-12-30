/**
 * @author Benjamin Assadsolimani
 * Configuration file
 */

'use strict';

import * as debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration file class, representing a single configuration file inside the configuration folder or one of its sub-folders.
 */
export class ConfigFile {
  filepath: string;
  configFolder: string;
  folderTags: boolean;
  tagDefinitions: any;
  tagSeparator: string;
  keyValSeparator: string;
  tags: any;
  namespace: string;

  /**
   * Create a new configuration file.
   * @param filepath - Path to the configuration file.
   * @param options - Options object.
   * @param options.configFolder - Configuration files folder.
   * @param options.folderTags - Whether to parse sub-folder names as tags if applicable (default: true).
   * @param options.tagDefinitions - Tag definitions.
   * @param options.tagSeparator - Seperation character for tags inside the filename (default: '.').
   * @param options.keyValSeparator - Seperation character for a tag's key and value (default: '-').
   */
  constructor(filepath: string, options: {
    configFolder?: string,
    folderTags?: boolean,
    tagDefinitions?: Object,
    tagSeparator?: string,
    keyValSeparator?: string
  } = {}) {
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

  get filename(): string { return path.basename(this.filepath); }

  get numTags(): number { return Object.keys(this.tags).length; }

  toString(): string { return `<${this.score}> ${this.filepath}`; }

  get score(): number {
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
   * @param configFolder - Config folder path.
   * @returns Array of folder names.
   */
  getFolders(configFolder: string): Array<string> {
    return path.dirname(this.filepath)
      .substr(configFolder.length + 1)
      .split(path.sep)
      .filter(d => d.length > 0);
  }

  /**
   * Process the path and filename of the configuration file regarding to the contained tags.
   * @param tagDefinitions - An object containing all tag definitions that should be considered.
   */
  processFilepath(tagDefinitions: Object) {
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
  loadJson(): Object {
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
