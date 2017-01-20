'use strict';


const Expect = require('expect.js');
const Faker = require('faker');
const User = require('./models/user');


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

});