'use strict';


const Expect = require('expect.js');
const Faker = require('faker');
const User = require('./models/user');
const Phone = require('./models/phone');


const dynamoDocClient = require('./utils/dynamo-doc-client');


describe('Create tests', () => {
    it('Should create record in database', () => {
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

    it('Should update record in database using only hashKey', () => {
        const newPassword = Faker.random.number();

        return User.first(dynamoDocClient)
            .then(user => {
                user.password = newPassword;
                return Promise.all([
                    user,
                    user.save()
                ]);
            })
            .spread((previousUser, newUser) => {
                Expect(newUser).to.not.be(null);
                Expect(newUser).to.be.an(User);
                Expect(newUser.email).to.be(previousUser.email);
                Expect(newUser.password).to.be(previousUser.password);

                return User.find(dynamoDocClient, newUser.email);
            })
            .then(user => {
                Expect(user.password).to.be(newPassword);
            })
    });

    it('Should update record in database using hashKey and rangeKey', () => {
        const newNumber = Faker.random.number();
        const newNotes = Faker.lorem.words();

        return Phone.first(dynamoDocClient)
            .then(phone => {
                phone.number = newNumber;
                phone.notes = newNotes;
                return Promise.all([
                    phone,
                    phone.save()
                ]);
            })
            .spread((previousPhone, newPhone) => {
                Expect(newPhone).to.not.be(null);
                Expect(newPhone).to.be.an(Phone);
                Expect(newPhone.customerId).to.be(previousPhone.customerId);
                Expect(newPhone.phoneId).to.be(previousPhone.phoneId);
                Expect(newPhone.number).to.be(previousPhone.number);
                Expect(newPhone.notes).to.be(previousPhone.notes);

                return Phone.find(dynamoDocClient, newPhone.customerId, newPhone.phoneId);
            })
            .then(phone => {
                Expect(phone.number).to.be(newNumber);
                Expect(phone.notes).to.be(newNotes);
            });
    });
});