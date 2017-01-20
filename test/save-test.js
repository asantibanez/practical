'use strict';


const Expect = require('expect.js');
const Faker = require('faker');
const User = require('./models/user');


const dynamoDocClient = require('./utils/dynamo-doc-client');


describe('Create tests', () => {
    it('Should save record in database', () => {
        const email = Faker.internet.email();

        const user = new User(dynamoDocClient);
        user.email = email;
        user.password = Faker.random.number();

        return user.save()
            .then((resultUser) => {
                Expect(resultUser).to.not.be(null);
            });
    });

    it('Should save record in database through static method', () => {
        const email = Faker.internet.email();
        const password = Faker.random.number();

        const data = { email: email, password: password };
        return User.create(dynamoDocClient, data)
            .then((resultUser) => {
                Expect(resultUser).to.not.be(null);
                Expect(resultUser.email).to.be(email);
                Expect(resultUser.password).to.be(password);
            });
    });
});