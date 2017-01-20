'use strict';


const Model = require('../../model');


class User extends Model {
    config() {
        this.tableName = 'Users';
        this.hashKey = 'email';
        this.attributes = [
            'email',
            'password'
        ];

        // const Customer = require('./customer');
        // this.hasOne('customer', Customer, 'email', 'Email-Index');
    }
}

module.exports = User;