
const Promise = require('bluebird');
const dynamoClient = require('../utils/dynamo-client');


const usersTable = require('./migrations/create-users-table');
const customersTable = require('./migrations/create-customers-table');
const phonesTable = require('./migrations/create-phones-table');


const migrations = [
    usersTable,
    customersTable,
    phonesTable
];
const setup = migrations.map(migration => {
    const tableName = migration.TableName;
    return deleteTable(tableName).then(() => createTable(migration));
});

Promise.all(setup).then(() => console.log('Database migration complete'));


function createTable(definition) {
    return new Promise((resolve, reject) => {
        dynamoClient.createTable(definition, (err, data) => {
            if (err)
                return reject(err);

            resolve(data);
        });
    });
}

function deleteTable(tableName) {
    return new Promise((resolve, reject) => {
        dynamoClient.deleteTable({ TableName: tableName }, (err, data) => {
            resolve(data);
        });
    });
}