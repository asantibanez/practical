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
    }
}

module.exports = Phone;