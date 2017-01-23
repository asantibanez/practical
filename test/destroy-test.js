'use strict';


const Expect = require('expect.js');
const Faker = require('faker');
const User = require('./models/user');


const dynamoDocClient = require('./utils/dynamo-doc-client');


describe('Destroy tests', () => {
    it('Should delete record in database', () => {
        const email = Faker.internet.email();
        const password = Faker.random.number();

        return User.create(dynamoDocClient, { email: email, password: password })
            .then(() => {
                return User.find(dynamoDocClient, email);
            })
            .then(user => {
                return user.trash();
            })
            .then(() => {
                return User.find(dynamoDocClient, email);
            })
            .then(user => {
                Expect(user).to.be(null);
            })
    });

    it('Should delete record in database using static method', () => {
        const email = Faker.internet.email();
        const password = Faker.random.number();

        return User.create(dynamoDocClient, { email: email, password: password })
            .then(() => {
                return User.destroy(dynamoDocClient, email);
            })
            .then(() => {
                return User.find(dynamoDocClient, email);
            })
            .then(user => {
                Expect(user).to.be(null);
            });
    });
});