'use strict';


const Promise = require('bluebird');
const Expect = require('expect.js');
const User = require('./models/user');
const Customer = require('./models/customer');

const dynamoDocClient = require('./utils/dynamo-doc-client');


describe('Has One tests', function() {

    it('Instance should return relate model', () => {
        return User.first(dynamoDocClient)
            .then(user => {
                return Promise.all([
                    user,
                    user.customer()
                ]);
            }).spread((user, customer) => {
                Expect(user).to.not.be(null);
                Expect(customer).to.not.be(null);
                Expect(customer.email).to.be(user.email);
            });
    });

});