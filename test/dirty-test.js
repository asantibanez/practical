'use strict';


const Expect = require('expect.js');
const Faker = require('faker');
const User = require('./models/user');


const dynamoDocClient = require('./utils/dynamo-doc-client');


describe('Dirty tests', () => {
    it('Should be completely dirty', () => {
        const user = new User(dynamoDocClient);
        user.email = Faker.internet.email();
        user.password = Faker.random.number();

        Expect(user.isDirty()).to.be(true);
        Expect(user.getDirty().hasOwnProperty('email')).to.be(true);
        Expect(user.getDirty().hasOwnProperty('password')).to.be(true);
    });

    it('Should be partially dirty', () => {
        const user = new User(dynamoDocClient);
        user.email = Faker.internet.email();

        Expect(user.isDirty()).to.be(true);
        Expect(user.getDirty().hasOwnProperty('email')).to.be(true);
        Expect(user.getDirty().hasOwnProperty('password')).to.be(false);
    });

    it('Should not be dirty', () => {
        const user = new User(dynamoDocClient);
        Expect(user.isDirty()).to.be(false);
    });
});