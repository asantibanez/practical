'use strict';


const Model = require('../../dist/model');


class User extends Model {
    config() {
        this.tableName = 'Users';
        this.hashKey = 'email';
        this.attributes = [
            'email',
            'password'
        ];

        const Customer = require('./customer');
        this.hasOne('customer', Customer, 'Email-Index', 'email');
    }
}

module.exports = User;