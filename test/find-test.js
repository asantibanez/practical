'use strict';


const Promise = require('bluebird');
const Expect = require('expect.js');
const Faker = require('faker');
const User = require('./models/user');
const Customer = require('./models/customer');
const Phone = require('./models/phone');


const dynamoDocClient = require('./utils/dynamo-doc-client');


describe('Find tests', () => {
    it('Should find saved record in database', () => {
        const email = Faker.internet.email();

        const user = new User(dynamoDocClient);
        user.email = email;
        user.password = Faker.random.number();

        return user.save()
            .then(() => {
                return User.find(dynamoDocClient, email);
            })
            .then(foundUser => {
                Expect(foundUser).to.not.be(null);
                Expect(foundUser).to.be.an(User);
                Expect(foundUser.email).to.be(user.email);
            });
    });

    it('Should find all records in database', () => {
        return User.all(dynamoDocClient)
            .then((users) => {
                Expect(users).to.not.be(null);
                Expect(users).to.be.an(Array);
                Expect(users.length).to.be.above(0);
                users.forEach(user => Expect(user).to.be.an(User));
            });
    });

    it('Should return first record in database', () => {
        return Promise.all([
            User.all(dynamoDocClient),
            User.first(dynamoDocClient)
        ])
            .spread((users, user) => {
                Expect(users).to.not.be(null);
                Expect(user).to.not.be(null);
                Expect(user).to.be.an(User);
                Expect(user.email).to.be(users[0].email);
            });
    });

    it('Should return queried records in database', () => {
        return User.first(dynamoDocClient)
            .then(user => {
                return Promise.all([
                    user,
                    Customer.query(dynamoDocClient)
                        .usingIndex('Email-Index', 'email')
                        .whereHash(user.email)
                        .first()
                ]);
            })
            .spread((user, customer) => {
                return Promise.all([
                    user,
                    customer,
                    Phone.query(dynamoDocClient)
                        .whereHash(customer.customerId)
                        .get()
                ])
            })
            .spread((user, customer, phones) => {
                Expect(user).to.not.be(null);
                Expect(customer).to.not.be(null);
                Expect(phones).to.not.be(null);
                Expect(phones).to.be.an(Array);

                Expect(customer.email).to.be(user.email);
                phones.forEach(phone => {
                    Expect(phone.customerId).to.be(customer.customerId);
                });
            });
    });

});