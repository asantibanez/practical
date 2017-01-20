
module.exports = {
    AttributeDefinitions: [
        {
            AttributeName: 'customerId',
            AttributeType: 'S'
        },
        {
            AttributeName: 'phoneId',
            AttributeType: 'S'
        }
    ],
    KeySchema: [
        {
            AttributeName: 'customerId',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'phoneId',
            KeyType: 'RANGE'
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    TableName: 'Phones'
};
