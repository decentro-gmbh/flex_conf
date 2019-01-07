/**
 * @author Benjamin Assadsolimani
 * Example database module using the database configuration to connect to a database
 */

import config from './config';

function connect() {
  console.log(`Connection to database '${config.database.username}@${config.database.host}:${config.database.port}'`);
}

connect();
