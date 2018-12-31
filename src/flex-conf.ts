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
import { ConfigFile } from './config-file';
import { TagDefinition } from './tag-definition';
import { getFilesFromDir } from './utils';

export interface IFlexConfOptions {
  /** Tag definitions */
  tagDefinitions?: Object;
  /** Whether to load sub-folders of the configuration folder recursively (default: true) */
  loadRecursive?: boolean;
  /** Whether to parse sub-folder names as tags if applicable (default: true) */
  folderTags?: boolean;
  /** Whether to parse command line arguments (default: true) */
  parseArgv?: boolean;
  /** Whether to parse environment variables (default: true) */
  parseEnv?: boolean;
  /** Seperator for environment variables (default: '__') */
  separator?: string;
  /** Seperator for environment variables (default: 'json') */
  postfix?: string;
  /** Whether to lower-case environment variables (default: false) */
  lowerCase?: boolean;
  /** Attempt to parse well-known values (e.g. 'false', 'true', 'null', 'undefined', '3', '5.1' and JSON values) into their proper types. If a value cannot be parsed, it will remain a string (default: false) */
  parseValues?: boolean;
  /** Whether to automatically load all configuration files on instantiation (default: true) */
  autoload?: boolean;
}

/**
 * FlexConf class, representing the entire config of the config folder
 */
export class FlexConf {
  public configFiles: Array<ConfigFile>;
  public store: nconf.Provider;

  private configFolder: string;
  private loadRecursive: boolean;
  private folderTags: boolean;
  private postfix: string;
  private parseArgv: boolean;
  private parseEnv: boolean;
  private autoload: boolean;
  private separator: string;
  private lowerCase: boolean;
  private parseValues: boolean;
  private tagDefinitions: { [key: string]: TagDefinition};

  /**
   * Create a new configuration instance.
   * @param configFolder - Path to the folder that holds all configuration files.
   * @param options - FlexConf configuration options.
   */
  constructor(configFolder: string, options: IFlexConfOptions = {}) {
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
    this.lowerCase = options.lowerCase !== undefined ? options.lowerCase : false;
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
  loadConfigFiles(): void {
    // Get all config files
    const filenames = getFilesFromDir(this.configFolder, this.postfix, this.loadRecursive);
    filenames.forEach((filename) => {
      const configFile = new ConfigFile(filename, this.configFolder, {
        tagDefinitions: this.tagDefinitions,
        folderTags: this.folderTags,
      });

      debug(`Processing config file: ${configFile.toString()}`);
      configFile.processFilepath();
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
   * @param  namespace - Config namespace to save to a file.
   * @param  options - Options object.
   * @param  options.filepath - Path to save the config file to, defaults to '[os.tmpdir()]/[namespace].json'.
   * @param  options.space - A String or Number object that's used to insert white space into the output JSON string for readability purposes.
   * @param  options.encoding - File encoding, default to 'utf8'.
   * @param  options.flag - Write operation flags, defaults to 'w'.
   * @param  options.mode - File permissions, default to read-only for the owner (0o600).
   * @returns Path of the saved config file.
   */
  saveToFile(namespace: string, options: {
    filepath?: string,
    space?: string|number,
    encoding?: string
    flag?: string
    mode?: number,
  } = {}): string {
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
  final(): any {
    return this.store.get();
  }
}
