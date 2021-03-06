'use strict';


const Model = require('../../dist/model');


class Customer extends Model {
    config() {
        this.tableName = 'Customers';
        this.hashKey = 'customerId';
        this.attributes = [
            'customerId',
            'firstName',
            'lastName',
            'email'
        ];

        const User = require('./user');
        this.belongsTo('user', User, null, 'email');

        const Phone = require('./phone');
        this.hasMany('phones', Phone);
    }
}

module.exports = Customer;