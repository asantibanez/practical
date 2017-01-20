
module.exports = {
    AttributeDefinitions: [
        {
            AttributeName: 'email',
            AttributeType: 'S'
        },
    ],
    KeySchema: [
        {
            AttributeName: 'email',
            KeyType: 'HASH'
        },
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    TableName: 'Users'
};
