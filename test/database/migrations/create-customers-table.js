
module.exports = {
    AttributeDefinitions: [
        {
            AttributeName: 'customerId',
            AttributeType: 'S'
        },
        {
            AttributeName: 'email',
            AttributeType: 'S'
        },
    ],
    KeySchema: [
        {
            AttributeName: 'customerId',
            KeyType: 'HASH'
        },
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'Email-Index',
            KeySchema: [
                {
                    AttributeName: 'email',
                    KeyType: 'HASH'
                }
            ],
            Projection: {
                ProjectionType: 'ALL'
            },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    TableName: 'Customers'
};
