
const AWS = require('aws-sdk');


AWS.config.credentials = new AWS.SharedIniFileCredentials({
    profile: process.env.AWS_PROFILE
});
AWS.config.update({ region: 'us-east-1' });

const dynamoDocClient = new AWS.DynamoDB.DocumentClient({
    endpoint: new AWS.Endpoint('http://localhost:8000')
});


module.exports = dynamoDocClient;