/**
 * @author Benjamin Assadsolimani
 * Example database module using the database configuration to connect to a database
 */

'use strict';

const config = require('./config');

function connect() {
  console.log(`Connection to database '${config.database.username}@${config.database.host}:${config.database.port}'`);
}

connect();
