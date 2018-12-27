/**
 * @author Benjamin Assadsolimani
 * Tag Definition class
 */

'use strict';

export class TagDefinition {
  name: string;
  applies: Function;
  map: Function;
  score: Function;

  /**
   * Create a new TagDefinition instance.
   * @param {string} name - Name of the tag.
   * @param {Object} options - Tag options.
   * @param {Function} [options.applies] - Function to check whether the tag value applies -> the configuration file is loaded.
   * @param {Function} [options.map] - Function to transform a tag value before further processing it.
   * @param {Function} [options.score] - Function to compute a score value for the tag.
   */
  constructor(name, options) {
    this.name = name;
    this.applies = options.applies || function () { return false; };
    this.map = options.map || function (val) { return val; };
    this.score = options.score || function () { return 1; };
  }
}
