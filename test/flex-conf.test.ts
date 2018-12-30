/**
 *
 */

 import { FlexConf } from '../src/flex-conf';
 import { join } from 'path';

 describe('Correct loading of a specific configuration file', () => {
   test('Tag-based configuration file loading', () => {
     for (let tag1 = 1; tag1 <= 2; tag1 += 1) {
      for (let tag2 = 1; tag2 <= 2; tag2 += 1) {
        const flexConf = new FlexConf(join(__dirname, 'configs'), {
          folderTags: true,
          tagDefinitions: {
            tag1: {
             applies: val => val === `val${tag1}`
            },
            tag2: {
             applies: val => val === `val${tag2}`
            }
          }
         });
         const config = flexConf.final();
         expect(config.name1).toMatchSnapshot();
      }
     }

   });
 });
