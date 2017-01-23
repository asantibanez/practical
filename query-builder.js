'use strict';


const Promise = require('bluebird');


class QueryBuilder {

    constructor(dynamoDocClient) {
        this.dynamoDocClient = dynamoDocClient;

        this.hashKeySpecified = false;
        this.rangeKeySpecified = false;
        this.indexNameSpecified = false;
        this.limitSpecified = false;
    }

    usingIndex(indexName, indexHashKey, indexRangeKey) {
        if (indexName) {
            this.indexNameSpecified = true;
            this.indexName = indexName;
            this.indexHashKey = indexHashKey;
            this.indexRangeKey = indexRangeKey;
        }

        return this;
    }

    withLimit(limit) {
        this.limitSpecified = true;
        this.limit = limit;

        return this;
    }

    withModel(model) {
        this.model = model;
        return this;
    }

    whereHash(value, attribute) {
        this.hashKeySpecified = true;
        this.hashKeyValue = value;
        this.hashKey = attribute || this.newModelInstance().hashKey;

        return this;
    }

    whereRange(value, operator, attribute) {
        this.rangeKeySpecified = true;

        this.rangeKeyValue = value;
        this.rangeKeyOperator = operator;
        this.rangeKey = attribute || this.newModelInstance().rangeKey;

        return this;
    }

    newModelInstance() {
        return new this.model(this.dynamoDocClient);
    }

    getModelTableName() {
        return this.newModelInstance().getTableName();
    }

    getQueryKeyConditionExpression() {
        const hashKeyAttribute = this.indexHashKey || this.hashKey;
        const rangeKeyAttribute = this.indexRangeKey || this.rangeKey;

        const keyConditionExpressionParts = [];
        keyConditionExpressionParts.push(`${hashKeyAttribute} = :${hashKeyAttribute}`);
        if (this.rangeKeySpecified && rangeKeyAttribute) {
            keyConditionExpressionParts.push(`${rangeKeyAttribute} ${this.rangeKeyOperator} :${rangeKeyAttribute}`);
        }

        return keyConditionExpressionParts.join(` AND `);
    }

    getQueryExpressionAttributeValues() {
        const hashKeyAttribute = this.indexHashKey || this.hashKey;
        const rangeKeyAttribute = this.indexRangeKey || this.rangeKey;

        const expressionAttributeValues = {};
        expressionAttributeValues[`:${hashKeyAttribute}`] = this.hashKeyValue;
        if (this.rangeKeySpecified && rangeKeyAttribute) {
            expressionAttributeValues[`:${rangeKeyAttribute}`] = this.rangeKeyValue;
        }

        return expressionAttributeValues;
    }

    get() {
        const self = this;

        const params = {};
        params['TableName'] = this.getModelTableName();
        if (this.indexNameSpecified)
            params['IndexName'] = this.indexName;
        if (this.limitSpecified)
            params['Limit'] = this.limit;

        if (!this.hashKeySpecified) {
            return new Promise((resolve, reject) => {
                this.dynamoDocClient.scan(params, (err, data) => {
                    if (err) {
                        return reject(err);
                    }

                    const models = data.Items.map(item => {
                        const model = self.newModelInstance();
                        model.fill(item);
                        model.setExists();
                        return model;
                    });

                    return resolve(models);
                });
            });
        }

        params['KeyConditionExpression'] = this.getQueryKeyConditionExpression();
        params['ExpressionAttributeValues'] = this.getQueryExpressionAttributeValues();

        return new Promise((resolve, reject) => {
            this.dynamoDocClient.query(params, (err, data) => {
                if (err) {
                    return reject(err);
                }

                const models = data.Items.map(item => {
                    const model = self.newModelInstance();
                    model.fill(item);
                    model.setExists();
                    return model;
                });

                return resolve(models);
            });
        });
    }

    first() {
        this.withLimit(1);
        return this.get().then(models => models.length > 0 ? models[0] : null);
    }

    all() {
        return this.get();
    }
}

module.exports = QueryBuilder;