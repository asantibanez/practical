
const Faker = require('Faker');
const Promise = require('bluebird');

const User = require('../models/user');
const Customer = require('../models/customer');
const Phone = require('../models/phone');

const dynamoDocClient = require('../utils/dynamo-doc-client');


var models = [];
for(var i = 0; i < 10; i++) {
    var email = Faker.internet.email();
    var password = Faker.address.zipCode();
    var customerId = Faker.random.uuid();

    var user = new User(dynamoDocClient);
    user.email = email;
    user.password = password;
    models.push(user);

    var customer = new Customer(dynamoDocClient);
    customer.customerId = customerId;
    customer.firstName = Faker.name.firstName();
    customer.lastName = Faker.name.lastName();
    customer.email = email;
    models.push(customer);

    var phone1 = new Phone(dynamoDocClient);
    phone1.customerId = customerId;
    phone1.phoneId = Faker.random.uuid();
    phone1.number = Faker.phone.phoneNumber();
    phone1.extension = Faker.random.number();
    phone1.notes = Faker.lorem.words();
    models.push(phone1);

    var phone2 = new Phone(dynamoDocClient);
    phone2.customerId = customerId;
    phone2.phoneId = Faker.random.uuid();
    phone2.number = Faker.phone.phoneNumber();
    phone2.extension = Faker.random.number();
    phone2.notes = Faker.lorem.words();
    models.push(phone2);
}

Promise.each(models, model => model.save());
console.log('Database seeding complete');