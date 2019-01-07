/**
 * @author Benjamin Assadsolimani
 * Utility functions of the flex_conf package
 */

'use strict';

import * as fs from 'fs';
import * as path from 'path';

/**
 * Get all <filetype> files from a directory and all its sub-directories.
 * @param {string} dirpath - Directory path (relative or absolute).
 * @param {string} filetype - Filetype that should be considered.
 * @param {boolean} recursive - Whether to get files from sub-directories.
 * @returns {Array<string>} Array of paths of the found '.<filetype>' files (sorted).
 */
export function getFilesFromDir(dirpath, filetype = null, recursive = false) {
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
    files = files.filter((file) => file.endsWith(`.${filetype}`));
  }
  files.sort();

  return files;
}
