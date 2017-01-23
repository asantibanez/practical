'use strict';


const Model = require('../../model');


class Phone extends Model {
    config() {
        this.tableName = 'Phones';
        this.hashKey = 'customerId';
        this.rangeKey = 'phoneId';
        this.attributes = [
            'customerId',
            'phoneId',
            'number',
            'extension',
            'notes'
        ];

        const Customer = require('./customer');
        this.belongsTo('customer', Customer);
    }
}

module.exports = Phone;