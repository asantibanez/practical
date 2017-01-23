'use strict';


const Promise = require('bluebird');
const Expect = require('expect.js');
const Customer = require('./models/customer');
const Phone = require('./models/phone');

const dynamoDocClient = require('./utils/dynamo-doc-client');


describe('Has Many tests', function() {

    it('Instance should return related models', () => {
        return Customer.first(dynamoDocClient)
            .then(customer => {
                return Promise.all([
                    customer,
                    customer.phones()
                ]);
            }).spread((customer, phones) => {
                Expect(customer).to.not.be(null);
                Expect(phones).to.not.be(null);
                Expect(phones).to.be.an(Array);

                phones.forEach(phone => {
                    Expect(phone).to.be.a(Phone);
                    Expect(phone.customerId).to.be(customer.customerId);
                });
            });
    });

});