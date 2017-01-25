'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require('bluebird');
var Moment = require('moment');
var Helpers = require('./helpers');
var QueryBuilder = require('./query-builder');

var Model = function () {
    function Model(dynamoDocClient) {
        _classCallCheck(this, Model);

        this.dynamoDocClient = dynamoDocClient;
        if (!this.dynamoDocClient) throw new Error('Must provide a valid DynamoDB.DocumentClient instance');

        this.tableName = null;
        this.hashKey = null;
        this.rangeKey = null;

        this.timestamps = true;

        this.attributes = [];

        this.original = {};

        this.relationships = {};

        this.exists = false;

        if (!this.config) throw new Error('No config() provided');

        this.config();
        this.checkConfig();
        this.initAttributes();
    }

    _createClass(Model, [{
        key: 'checkConfig',
        value: function checkConfig() {
            if (!this.tableName) throw new Error('No Table Name has been defined');

            if (!this.hashKey) throw new Error('No Hash Key has been defined');

            if (this.rangeKey && this.rangeKey === this.hashKey) throw new Error('Range Key must differ from Hash Key');

            if (!Array.isArray(this.attributes)) throw new Error('Attributes property must be an array');
        }
    }, {
        key: 'initAttributes',
        value: function initAttributes() {
            var self = this;

            this[this.hashKey] = null;
            if (this.rangeKey) this[this.rangeKey] = null;

            this.attributes.forEach(function (attribute) {
                self[attribute] = null;
                self.original[attribute] = null;
            });

            this.__updateTimestamps();
        }
    }, {
        key: '__updateTimestamps',
        value: function __updateTimestamps() {
            if (!this.timestamps) return;

            if (!this.createdAt) this.createdAt = Moment();

            this.updatedAt = Moment();
        }
    }, {
        key: 'fill',
        value: function fill(data) {
            var self = this;
            Object.keys(data).forEach(function (key) {
                self[key] = data[key];
                self.original[key] = data[key];
            });
        }
    }, {
        key: 'setExists',
        value: function setExists() {
            this.exists = true;
        }
    }, {
        key: 'isDirty',
        value: function isDirty() {
            return Object.keys(this.getDirty()).length > 0;
        }
    }, {
        key: 'getDirty',
        value: function getDirty(includeKeys) {
            var self = this;

            var dirty = {};
            this.attributes.forEach(function (attribute) {
                if (self.original[attribute] === undefined) {
                    dirty[attribute] = self[attribute];
                } else if (self[attribute] !== self.original[attribute]) {
                    dirty[attribute] = self[attribute];
                }
            });

            return dirty;
        }
    }, {
        key: 'save',
        value: function save() {
            if (this.exists) return this.__performUpdate();

            return this.__performInsert();
        }
    }, {
        key: 'trash',
        value: function trash() {
            if (!this.exists) {
                return Promise.reject(new Error('Model has not been loaded'));
            }

            return this.__performDelete();
        }
    }, {
        key: '__performInsert',
        value: function __performInsert() {
            var _this = this;

            var self = this;

            this.__updateTimestamps();

            var item = {};
            this.attributes.forEach(function (attribute) {
                item[attribute] = _this[attribute];
            });

            if (this.timestamps) {
                item.createdAt = this.createdAt.format();
                item.updatedAt = this.updatedAt.format();
            }

            var conditionExpressionParts = [];
            conditionExpressionParts.push('attribute_not_exists(' + this.hashKey + ')');
            if (this.rangeKey) {
                conditionExpressionParts.push('attribute_not_exists(' + this.rangeKey + ')');
            }

            var params = {
                TableName: this.tableName,
                Item: item,
                ConditionExpression: conditionExpressionParts.join(' AND ')
            };

            return new Promise(function (resolve, reject) {
                self.dynamoDocClient.put(params, function (err, data) {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(self);
                });
            });
        }
    }, {
        key: '__performUpdate',
        value: function __performUpdate() {
            var self = this;

            if (!this.isDirty()) {
                return Promise.resolve(this);
            }

            var params = {};
            params['TableName'] = this.getTableName();
            params['Key'] = this.getKeyObject();
            params['UpdateExpression'] = this.__getUpdateExpressionForUpdate();
            params['ExpressionAttributeNames'] = this.__getExpressionAttributesNamesForUpdate();
            params['ExpressionAttributeValues'] = this.__getExpressionAttributesValuesForUpdate();

            return new Promise(function (resolve, reject) {
                self.dynamoDocClient.update(params, function (err, data) {
                    if (err) {
                        console.log('-- Update command --');
                        console.log(JSON.stringify(params, null, 2));
                        console.log('--------------------');
                        return reject(err);
                    }

                    return resolve(self);
                });
            });
        }
    }, {
        key: '__getUpdateExpressionForUpdate',
        value: function __getUpdateExpressionForUpdate() {
            var dirty = this.getDirty();
            var updateExpressionParts = [];
            Object.keys(dirty).forEach(function (attribute) {
                updateExpressionParts.push('#' + attribute + 'Alias = :' + attribute + 'Alias');
            });

            return 'set ' + updateExpressionParts.join(', ');
        }
    }, {
        key: '__getExpressionAttributesNamesForUpdate',
        value: function __getExpressionAttributesNamesForUpdate() {
            var dirty = this.getDirty();
            var expressionAttributesNames = {};
            Object.keys(dirty).forEach(function (attribute) {
                expressionAttributesNames['#' + attribute + 'Alias'] = attribute;
            });

            // if (this.hasRangeKey()) {
            //     expressionAttributesNames[`#${this.getRangeKeyAttribute()}Alias`] = this.getRangeKeyAttribute();
            // } else {
            //     expressionAttributesNames[`#${this.getHashKeyAttribute()}Alias`] = this.getHashKeyAttribute();
            // }

            return expressionAttributesNames;
        }
    }, {
        key: '__getExpressionAttributesValuesForUpdate',
        value: function __getExpressionAttributesValuesForUpdate() {
            var dirty = this.getDirty();
            var expressionAttributesValues = {};
            Object.keys(dirty).forEach(function (attribute) {
                expressionAttributesValues[':' + attribute + 'Alias'] = dirty[attribute];
            });

            return expressionAttributesValues;
        }
    }, {
        key: '__getConditionExpressionForUpdate',
        value: function __getConditionExpressionForUpdate() {
            if (this.hasRangeKey()) {
                return 'attribute_exists(#alias' + this.getRangeKeyAttribute() + ')';
            }

            return 'attribute_exists(#alias' + this.getHashKeyAttribute() + ')';
        }
    }, {
        key: '__performDelete',
        value: function __performDelete() {
            var self = this;

            var params = {};
            params['TableName'] = this.getTableName();
            params['Key'] = this.getKeyObject();

            return new Promise(function (resolve, reject) {
                self.dynamoDocClient.delete(params, function (err, data) {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(data);
                });
            });
        }
    }, {
        key: 'getTableName',
        value: function getTableName() {
            return this.tableName;
        }
    }, {
        key: 'getKeyObject',
        value: function getKeyObject() {
            var key = {};
            key[this.getHashKeyAttribute()] = this.getHashKeyValue();

            if (this.hasRangeKey()) key[this.getRangeKeyAttribute()] = this.getRangeKeyValue();

            return key;
        }
    }, {
        key: 'getHashKeyAttribute',
        value: function getHashKeyAttribute() {
            return this.hashKey;
        }
    }, {
        key: 'getHashKeyValue',
        value: function getHashKeyValue() {
            return this[this.getHashKeyAttribute()];
        }
    }, {
        key: 'hasRangeKey',
        value: function hasRangeKey() {
            return this.rangeKey;
        }
    }, {
        key: 'getRangeKeyAttribute',
        value: function getRangeKeyAttribute() {
            return this.rangeKey;
        }
    }, {
        key: 'getRangeKeyValue',
        value: function getRangeKeyValue() {
            return this[this.getRangeKeyAttribute()];
        }
    }, {
        key: 'getAttributeValue',
        value: function getAttributeValue(attribute) {
            return this[attribute];
        }
    }, {
        key: 'hasRelationship',
        value: function hasRelationship(name) {
            return this.relationships.hasOwnProperty(name);
        }
    }, {
        key: 'newRelationship',
        value: function newRelationship(name, model, indexName, hashKey, rangeKey) {
            this.relationships[name] = {
                model: model,
                hashKey: hashKey,
                rangeKey: rangeKey,
                indexName: indexName,
                loaded: false,
                value: null
            };
        }
    }, {
        key: 'belongsTo',
        value: function belongsTo(name, model, indexName, hashKey, rangeKey) {
            var _this2 = this;

            var self = this;

            if (this.hasRelationship(name)) return;

            this.newRelationship(name, model, indexName, hashKey, rangeKey);

            this[name] = function (forceLoad) {
                var relationship = self.relationships[name];
                if (forceLoad || !relationship.loaded) {
                    var query = new QueryBuilder(self.dynamoDocClient);
                    return query.withModel(model).usingIndex(indexName, hashKey, rangeKey).whereHash(_this2.getAttributeValue(hashKey || _this2.getHashKeyAttribute())).whereRange(_this2.getAttributeValue(rangeKey || _this2.getRangeKeyAttribute())).first().then(function (model) {
                        self.relationships[name].value = model;
                        self.relationships[name].loaded = true;
                        return Promise.resolve(model);
                    });
                }

                return Promise.resolve(relationship.value);
            };
        }
    }, {
        key: 'hasOne',
        value: function hasOne(name, model, indexName, hashKey, rangeKey) {
            var _this3 = this;

            var self = this;

            if (this.hasRelationship(name)) return;

            this.newRelationship(name, model, indexName, hashKey, rangeKey);

            this[name] = function (forceLoad) {
                var relationship = self.relationships[name];
                if (forceLoad || !relationship.loaded) {
                    var query = new QueryBuilder(self.dynamoDocClient);
                    return query.withModel(model).usingIndex(indexName, hashKey, rangeKey).whereHash(_this3.getAttributeValue(hashKey || _this3.getHashKeyAttribute())).whereRange(_this3.getAttributeValue(rangeKey || _this3.getRangeKeyAttribute())).first().then(function (model) {
                        self.relationships[name].value = model;
                        self.relationships[name].loaded = true;
                        return Promise.resolve(model);
                    });
                }

                return Promise.resolve(relationship.value);
            };
        }
    }, {
        key: 'hasMany',
        value: function hasMany(name, model, indexName, hashKey, rangeKey) {
            var _this4 = this;

            var self = this;

            if (this.hasRelationship(name)) return;

            this.newRelationship(name, model, indexName, hashKey, rangeKey);

            this[name] = function (forceLoad) {
                var relationship = self.relationships[name];
                if (forceLoad || !relationship.loaded) {
                    var query = new QueryBuilder(self.dynamoDocClient);
                    return query.withModel(model).usingIndex(indexName, hashKey, rangeKey).whereHash(_this4.getAttributeValue(hashKey || _this4.getHashKeyAttribute())).whereRange(_this4.getAttributeValue(rangeKey || _this4.getRangeKeyAttribute())).get().then(function (models) {
                        self.relationships[name].value = models;
                        self.relationships[name].loaded = true;
                        return Promise.resolve(models);
                    });
                }

                return Promise.resolve(relationship.value);
            };

            this['where' + Helpers.uppercaseFirst(name)] = function () {
                var query = new QueryBuilder(self.dynamoDocClient);
                return query.withModel(model).whereHash(_this4.getAttributeValue(hashKey || _this4.getHashKeyAttribute()));
            };
        }
    }], [{
        key: 'destroy',
        value: function destroy(dynamoDocClient, hashKey, rangeKey) {
            return this.find(dynamoDocClient, hashKey, rangeKey).then(function (model) {
                return model.trash();
            });
        }
    }, {
        key: 'create',
        value: function create(dynamoDocClient, data) {
            var model = new this(dynamoDocClient);
            model.fill(data);
            return model.save();
        }
    }, {
        key: 'find',
        value: function find(dynamoDocClient, hashKey, rangeKey) {
            var query = new QueryBuilder(dynamoDocClient);
            return query.withModel(this).whereHash(hashKey).whereRange(rangeKey).first();
        }
    }, {
        key: 'all',
        value: function all(dynamoDocClient) {
            var query = new QueryBuilder(dynamoDocClient);
            return query.withModel(this).all();
        }
    }, {
        key: 'first',
        value: function first(dynamoDocClient) {
            var query = new QueryBuilder(dynamoDocClient);
            return query.withModel(this).withLimit(1).all().then(function (models) {
                return models.length > 0 ? models[0] : null;
            });
        }
    }, {
        key: 'query',
        value: function query(dynamoDocClient) {
            var query = new QueryBuilder(dynamoDocClient);
            return query.withModel(this);
        }
    }]);

    return Model;
}();

module.exports = Model;