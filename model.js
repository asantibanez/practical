'use strict';


const Promise = require('bluebird');
const Moment = require('moment');
const Helpers = require('./helpers');
const QueryBuilder = require('./query-builder');


class Model {

    constructor(dynamoDocClient) {
        this.dynamoDocClient = dynamoDocClient;
        if (!this.dynamoDocClient)
            throw new Error('Must provide a valid DynamoDB.DocumentClient instance');

        this.tableName = null;
        this.hashKey = null;
        this.rangeKey = null;

        this.timestamps = true;

        this.attributes = [];

        this.original = {};

        this.relationships = {};

        this.exists = false;

        if(!this.config)
            throw new Error('No config() provided');

        this.config();
        this.checkConfig();
        this.initAttributes();
    }

    checkConfig() {
        if (!this.tableName)
            throw new Error('No Table Name has been defined');

        if (!this.hashKey)
            throw new Error('No Hash Key has been defined');

        if (this.rangeKey && this.rangeKey === this.hashKey)
            throw new Error('Range Key must differ from Hash Key');

        if (!Array.isArray(this.attributes))
            throw new Error('Attributes property must be an array');
    }

    initAttributes() {
        const self = this;

        this[this.hashKey] = null;
        if (this.rangeKey)
            this[this.rangeKey] = null;

        this.attributes.forEach(attribute => {
            self[attribute] = null;
            self.original[attribute] = null;
        });

        this.__updateTimestamps();
    }

    __updateTimestamps() {
        if (!this.timestamps)
            return;

        if (!this.createdAt)
            this.createdAt = Moment();

        this.updatedAt = Moment();
    }

    fill(data) {
        const self = this;
        Object.keys(data).forEach(key => {
            self[key] = data[key];
            self.original[key] = data[key];
        });
    }

    setExists() {
        this.exists = true;
    }

    isDirty() {
        return Object.keys(this.getDirty()).length > 0;
    }

    getDirty() {
        const self = this;

        const dirty = {};
        this.attributes.forEach(attribute => {
            if(self.original[attribute] === undefined) {
                dirty[attribute] = self[attribute];
            } else if (self[attribute] !== self.original[attribute]) {
                dirty[attribute] = self[attribute];
            }
        });

        return dirty;
    }

    save() {
        if (this.exists)
            return this.__performUpdate();

        return this.__performInsert();
    }

    trash() {
        if (!this.exists) {
            return Promise.reject(new Error('Model has not been loaded'));
        }

        return this.__performDelete();
    }

    __performInsert() {
        const self = this;

        this.__updateTimestamps();

        const item = {};
        this.attributes.forEach(attribute => {
            item[attribute] = this[attribute];
        });

        if(this.timestamps) {
            item.createdAt = this.createdAt.format();
            item.updatedAt = this.updatedAt.format();
        }

        const conditionExpressionParts = [];
        conditionExpressionParts.push(`attribute_not_exists(${this.hashKey})`);
        if (this.rangeKey) {
            conditionExpressionParts.push(`attribute_not_exists(${this.rangeKey})`);
        }

        const params = {
            TableName: this.tableName,
            Item: item,
            ConditionExpression: conditionExpressionParts.join(' AND ')
        };

        return new Promise((resolve, reject) => {
            self.dynamoDocClient.put(params, (err, data) => {
                if (err) {
                    return reject(err);
                }

                return resolve(self);
            });
        });
    }

    __performUpdate() {

    }

    __performDelete() {
        const self = this;

        const key = {};
        key[this.getHashKeyAttribute()] = this.getHashKeyValue();

        if (this.hasRangeKey())
            key[this.getRangeKeyAttribute()] = this.getRangeKeyValue();

        const params = {};
        params['TableName'] = this.getTableName();
        params['Key'] = key;

        return new Promise((resolve, reject) => {
            self.dynamoDocClient.delete(params, (err, data) => {
                if (err) {
                    return reject(err);
                }

                return resolve(data);
            });
        });
    }

    getTableName() {
        return this.tableName;
    }

    getHashKeyAttribute() {
        return this.hashKey;
    }

    getHashKeyValue() {
        return this[this.getHashKeyAttribute()];
    }

    hasRangeKey() {
        return this.rangeKey;
    }

    getRangeKeyAttribute() {
        return this.rangeKey;
    }

    getRangeKeyValue() {
        return this[this.getRangeKeyAttribute()];
    }

    getAttributeValue(attribute) {
        return this[attribute];
    }

    static destroy(dynamoDocClient, hashKey, rangeKey) {
        return this.find(dynamoDocClient, hashKey, rangeKey)
            .then(model => {
                return model.trash();
            });
    }

    static create(dynamoDocClient, data) {
        const model = new this(dynamoDocClient);
        model.fill(data);
        return model.save();
    }

    static find(dynamoDocClient, hashKey, rangeKey) {
        const query = new QueryBuilder(dynamoDocClient);
        return query
            .withModel(this)
            .whereHash(hashKey)
            .whereRange(rangeKey)
            .first();
    }

    static all(dynamoDocClient) {
        const query = new QueryBuilder(dynamoDocClient);
        return query.withModel(this).all();
    }

    static first(dynamoDocClient) {
        const query = new QueryBuilder(dynamoDocClient);
        return query.withModel(this)
            .withLimit(1)
            .all()
            .then(models => models.length > 0 ? models[0] : null);
    }

    static query(dynamoDocClient) {
        const query = new QueryBuilder(dynamoDocClient);
        return query.withModel(this);
    }

    hasRelationship(name) {
        return this.relationships.hasOwnProperty(name);
    }

    newRelationship(name, model, indexName, hashKey, rangeKey) {
        this.relationships[name] = {
            model: model,
            hashKey: hashKey,
            rangeKey: rangeKey,
            indexName: indexName,
            loaded: false,
            value: null
        };
    }

    belongsTo(name, model, indexName, hashKey, rangeKey) {
        const self = this;

        if (this.hasRelationship(name))
            return;

        this.newRelationship(name, model, indexName, hashKey, rangeKey);

        this[name] = (forceLoad) => {
            const relationship = self.relationships[name];
            if (forceLoad || !relationship.loaded) {
                const query = new QueryBuilder(self.dynamoDocClient);
                return query
                    .withModel(model)
                    .usingIndex(indexName, hashKey, rangeKey)
                    .whereHash(this.getAttributeValue(hashKey || this.getHashKeyAttribute()))
                    .whereRange(this.getAttributeValue(rangeKey || this.getRangeKeyAttribute()))
                    .first()
                    .then((model) => {
                        self.relationships[name].value = model;
                        self.relationships[name].loaded = true;
                        return Promise.resolve(model);
                    });
            }

            return Promise.resolve(relationship.value);
        };
    }

    hasOne(name, model, indexName, hashKey, rangeKey) {
        const self = this;

        if (this.hasRelationship(name))
            return;

        this.newRelationship(name, model, indexName, hashKey, rangeKey);

        this[name] = (forceLoad) => {
            const relationship = self.relationships[name];
            if (forceLoad || !relationship.loaded) {
                const query = new QueryBuilder(self.dynamoDocClient);
                return query
                    .withModel(model)
                    .usingIndex(indexName, hashKey, rangeKey)
                    .whereHash(this.getAttributeValue(hashKey || this.getHashKeyAttribute()))
                    .whereRange(this.getAttributeValue(rangeKey || this.getRangeKeyAttribute()))
                    .first()
                    .then((model) => {
                        self.relationships[name].value = model;
                        self.relationships[name].loaded = true;
                        return Promise.resolve(model);
                    });
            }

            return Promise.resolve(relationship.value);
        };
    }

    /*
    hasMany(name, model, hashKey, indexName) {
        const self = this;

        if (this.hasRelationship(name))
            return;

        this.newRelationship(name, model, hashKey, indexName);

        this[name] = (forceLoad) => {
            const relationship = self.relationships[name];
            if (forceLoad || !relationship.loaded) {
                const query = new QueryBuilder(self.dynamoDocClient);
                return query
                    .withModel(model)
                    .whereHash(this[hashKey])
                    .withIndexName(indexName)
                    .get()
                    .then((models) => {
                        self.relationships[name].value = models;
                        self.relationships[name].loaded = true;
                        return Promise.resolve(models);
                    });
            }

            return Promise.resolve(relationship.value);
        };

        this[`where${Helpers.uppercaseFirst(name)}`] = () => {
            const query = new QueryBuilder(self.dynamoDocClient);
            return query.withModel(model).whereHash(this[hashKey], hashKey);
        };
    }
    */
}
module.exports = Model;