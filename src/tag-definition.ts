/**
 * @author Benjamin Assadsolimani
 * Tag definition class
 */

'use strict';

export class TagDefinition {
  /** Name of the tag */
  name: string;
  applies: Function;
  map: Function;
  score: Function;

  /**
   * Create a new TagDefinition instance.
   * @param name - Name of the tag.
   * @param options - Tag options.
   * @param options.applies - Function to check whether the tag value applies -> the configuration file is loaded.
   * @param options.map - Function to transform a tag value before further processing it.
   * @param options.score - Function to compute a score value for the tag.
   */
  constructor(name: string, options: {
    applies?: Function,
    map?: Function,
    score?: Function
  } = {}) {
    this.name = name;
    this.applies = options.applies || function () { return false; };
    this.map = options.map || function (val) { return val; };
    this.score = options.score || function () { return 1; };
  }
}
