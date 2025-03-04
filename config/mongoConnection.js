import {MongoClient} from 'mongodb';
import {mongoConfig} from './settings.js';

let _connection = undefined;
let _db = undefined;

const dbConnection = async () => {
  if (!_connection) {
    _connection = new MongoClient(mongoConfig.serverUrl);
    await _connection.connect();
    _db = _connection.db(mongoConfig.database);
  }


  return _db;
};

const closeConnection = async () => {
  if (_connection) {
    await _connection.close();
    _connection = undefined;
    _db = undefined;
  }
};

export {dbConnection, closeConnection};
