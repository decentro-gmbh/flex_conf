/**
 * Tests for the flex-conf module
 */

import { FlexConf } from '../src/flex-conf';
import { join } from 'path';

describe('Correct loading of configuration files', () => {
  test('Tag-based configuration file loading', () => {
    // Check for each combination of tag1 and tag2 whether the correct configuration file is loaded
    for (let tag1 = 1; tag1 <= 2; tag1 += 1) {
      for (let tag2 = 1; tag2 <= 2; tag2 += 1) {
        // Create flexConf such that the current tag values are required for a configuration file to be loaded
        const flexConf = new FlexConf(join(__dirname, 'configs'), {
          folderTags: true,
          tagDefinitions: {
            tag1: {
              applies: val => val === `val${tag1}`,
            },
            tag2: {
              applies: val => val === `val${tag2}`,
            },
          },
        });

        // Get the final config object
        const config = flexConf.final();

        // Expect the final config object to match the stored snapshot
        expect(config.name1).toMatchSnapshot();
      }
    }
  });

  test('Hierarchical, score-based loading of configuration files', () => {
    const flexConf = new FlexConf(join(__dirname, 'configs'), {
      folderTags: true,
      tagDefinitions: {
        tag1: {
          applies: () => true,
          score: (value) => value === 'val1' ? 2 : 4,
        },
        tag2: {
          applies: () => true,
          score: (value) => value === 'val1' ? 8 : 16,
        },
      },
    });

    // Check if the score of each config file was computed correctly
    flexConf.configFiles.forEach((configFile) => {
      switch (configFile.filename) {
        case 'name1.tag1-val1.tag2-val1.json':
          expect(configFile.score).toBe(10);
          break;
        case 'name1.tag1-val2.tag2-val1.json':
          expect(configFile.score).toBe(12);
          break;
        case 'name1.tag1-val1.tag2-val2.json':
          expect(configFile.score).toBe(18);
          break;
        case 'name1.tag1-val2.tag2-val2.json':
          expect(configFile.score).toBe(20);
          break;
        default: throw Error(`Unknown config filename: ${configFile.filename}`);
      }
    });

    // Get the final config object
    const config = flexConf.final();

    // Expect the final config object to match the stored snapshot
    expect(config.name1).toMatchSnapshot();
  });
});
