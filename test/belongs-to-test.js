'use strict';


const Promise = require('bluebird');
const Expect = require('expect.js');
const User = require('./models/user');
const Customer = require('./models/customer');
const Phone = require('./models/phone');

const dynamoDocClient = require('./utils/dynamo-doc-client');


describe('Has One tests', function() {

    it('Instance should return related model using Index', () => {
        return Customer.first(dynamoDocClient)
            .then(customer => {
                return Promise.all([
                    customer,
                    customer.user()
                ]);
            }).spread((customer, user) => {
                Expect(user).to.not.be(null);
                Expect(customer).to.not.be(null);
                Expect(user).to.be.an(User);
                Expect(user.email).to.be(customer.email);
            });
    });

    it('Instance should return related model', () => {
        return Phone.first(dynamoDocClient)
            .then(phone => {
                return Promise.all([
                    phone,
                    phone.customer()
                ]);
            }).spread((phone, customer) => {
                Expect(phone).to.not.be(null);
                Expect(customer).to.not.be(null);
                Expect(customer).to.be.a(Customer);
                Expect(customer.customerId).to.be(phone.customerId);
            });
    });

});