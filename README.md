
Practical
=========

A practical DynamoDB Active Record library.

Practical was built to simplify interactions with Amazon's DynamoDB. This NoSQL 
database is really powerful but the documentation is not easily read or understood. 
Practical takes away the burden allowing an accessing DynamoDB records in an Active 
Record fashion. 

Practical is heavily influenced by Laravel's Eloquent ORM (https://laravel.com/docs/5.3/eloquent) because 
of its fluent and expressive syntax when working with databases. Practical tries to 
emulate some of its features by allowing direct mapping to DynamoDB tables by configuring 
a Javascript class with your model's definition.

Practical uses Promises to return values when accessing the database. `Bluebird` 
library (http://bluebirdjs.com) implementation is used for this matter. 

**Note**

This is a WIP. Feel free to give any feedback on the library. Everyone welcomed!

## Installation

```
npm install practical
```


## Usage

To use `practical`, first start by creating a new Javascript class file that will represent 
a record of any of your database tables. In this class file, require `practical` package and 
extend your class with `practical`'s Model base class.

```
'use strict';

const Model = require('practical');

class Customer extends Model {

}

module.exports = Customer;
```

Afterwards, define a `config()` method that will provide `practical` the configuration of
database table. In this method you can define the following parameters:
- **tableName**: Name of your database table
- **hashKey**: Name of your table's hash key
- **rangeKey**: Name of your table's range key if any (Optional)
- **attributes**: Array with all attributes you want to use in your table. 
- **hasOne, hasMany, belongsTo**: defines relationships with other tables.

Below is an example of our `Customer`'s class with a sample configuration.

```
'use strict';

const Model = require('practical');

class Customer extends Model {
    this.config() {
        this.tableName = 'Customers';
        this.hashKey = 'customerId';
        this.attributes = [
            'customerId',
            'firstName',
            'lastName',
            'email'
        ];
    }
}

module.exports = Customer;
```

With the class and configuration in place, you can interact with your table and record
with the following methods. For each of the methods, you will require to pass along a 
`Dynamo.DocumentClient` object 
(http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html)
already setup with your credentials. You can setup a Dynamo.DocumentClient in the 
following matter:

```
const AWS = require('aws-sdk');

AWS.config.credentials = new AWS.SharedIniFileCredentials({
    profile: 'your-aws-profile-id' // Located in ~./aws/credentials file
});
AWS.config.update({ region: 'your-aws-region' });

const dynamoDocClient = new AWS.DynamoDB.DocumentClient();
```

### Get all Records from Table

```
const Customer = require('path/to/your/class');
Customer.all(dynamoDocClient)
    .then(customers => {
        //Work with returned records of Customers table
    });
```

You can limit the records you want returned with the `withLimit` method. When chaining
other methods, you issue the fetch request with the `get` method.

```
const Customer = require('path/to/your/class');
Customer.withLimit(10).get(dynamoDocClient)
    .then(tenCustomers => {
        //Work with returned records of Customers table
    });
```

Custom Indexes are also supported. You can define use them with the `usingIndex` method and 
providing the `indexName, hashKey and rangeKey`

```
const Customer = require('path/to/your/class');
Customer.usingIndex('Email-Index', email).withLimit(10).get(dynamoDocClient)
    .then(tenCustomersOrderedByEmail => {
        //Work with returned records of Customers table
    });
```

### Find a specific record from Table

```
const Customer = require('path/to/your/class');
const customerId = 'your-customer-id';
Customer.find(dynamoDocClient, customerId)
    .then(customers => {
        //Work with returned records of Customers table
    });
```
This method also works with range keys if your table makes use of it.

### Create record

To create a record in your table, you can use the `create` method passing along the data
you need as an object
```
const Customer = require('path/to/your/class');
const data = {
    customerId: 'your-id', 
    firstName: 'Andres', 
    lastName: 'Santibanez', 
    email: 'email@email.com'
};
Customer.create(dynamoDocClient, data)
    .then(customer => {
        //Work with saved customer record
    });
```

You can also create an instance of your table's class and assign the required values. 
Afterwards, use the `save` method to save the data in your table.

```
const Customer = require('path/to/your/class');

const customer = new Customer(dynamoDocClient);
customer.customerId = 'your-id'; 
customer.firstName = 'Andres'; 
customer.lastName = 'Santibanez'; 
customer.email = 'email@email.com';

customer.save()
    .then(customer => {
        //Work with saved customer record
    });
```

### Delete record

To delete a record in your table, use the `destroy` method passing along the hash key 
and range key values of your item.

```
const Customer = require('path/to/your/class');

Customer.destroy(dynamoDocClient, 'your-customer-id')
    .then(() => {
        //Customer deleted successfully
    });
```

You can also make this on an instance object using the `trash` method

```
const Customer = require('path/to/your/class');

Customer.find(dynamoDocClient, 'your-customer-id')
    .then(customer => {
        return customer.trash();
    })
    .then(() => {
        //Customer deleted successfully
    });
```

## Relationships

### Belong To
### Has One
### Has Many


## TODO
* Support for record updates
* Add documentation for other available methods: query(), save(), trash(), destroy()
* Add documentation for relationships accessors;
