'use strict';


const Model = require('../../model');


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

        // const User = require('./user');
        // this.belongsTo('user', User, 'email');
        //
        // const Phone = require('./phone');
        // this.hasMany('phones', Phone, 'customerId')
    }
}

module.exports = Customer;