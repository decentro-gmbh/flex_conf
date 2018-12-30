/**
 *
 */

 import { FlexConf } from '../src/flex-conf';
 import { join } from 'path';

 test('test 1', () => {
   const flexConf = new FlexConf(join(__dirname, 'configs'), {
     folderTags: true
    });
    const config = flexConf.final();

 });
