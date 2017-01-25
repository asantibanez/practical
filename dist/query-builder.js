'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require('bluebird');

var QueryBuilder = function () {
    function QueryBuilder(dynamoDocClient) {
        _classCallCheck(this, QueryBuilder);

        this.dynamoDocClient = dynamoDocClient;

        this.hashKeySpecified = false;
        this.rangeKeySpecified = false;
        this.indexNameSpecified = false;
        this.limitSpecified = false;
    }

    _createClass(QueryBuilder, [{
        key: 'usingIndex',
        value: function usingIndex(indexName, indexHashKey, indexRangeKey) {
            if (indexName) {
                this.indexNameSpecified = true;
                this.indexName = indexName;
                this.indexHashKey = indexHashKey;
                this.indexRangeKey = indexRangeKey;
            }

            return this;
        }
    }, {
        key: 'withLimit',
        value: function withLimit(limit) {
            this.limitSpecified = true;
            this.limit = limit;

            return this;
        }
    }, {
        key: 'withModel',
        value: function withModel(model) {
            this.model = model;
            return this;
        }
    }, {
        key: 'whereHash',
        value: function whereHash(value, attribute) {
            this.hashKeySpecified = true;
            this.hashKeyValue = value;
            this.hashKey = attribute || this.newModelInstance().hashKey;

            return this;
        }
    }, {
        key: 'whereRange',
        value: function whereRange(value, operator, attribute) {
            this.rangeKeySpecified = true;

            this.rangeKeyValue = value;
            this.rangeKeyOperator = operator || ' = ';
            this.rangeKey = attribute || this.newModelInstance().rangeKey;

            return this;
        }
    }, {
        key: 'newModelInstance',
        value: function newModelInstance() {
            return new this.model(this.dynamoDocClient);
        }
    }, {
        key: 'getModelTableName',
        value: function getModelTableName() {
            return this.newModelInstance().getTableName();
        }
    }, {
        key: 'getQueryKeyConditionExpression',
        value: function getQueryKeyConditionExpression() {
            var hashKeyAttribute = this.indexHashKey || this.hashKey;
            var rangeKeyAttribute = this.indexRangeKey || this.rangeKey;

            var keyConditionExpressionParts = [];
            keyConditionExpressionParts.push(hashKeyAttribute + ' = :' + hashKeyAttribute);
            if (this.rangeKeySpecified && rangeKeyAttribute && this.rangeKeyValue) {
                keyConditionExpressionParts.push(rangeKeyAttribute + ' ' + this.rangeKeyOperator + ' :' + rangeKeyAttribute);
            }

            return keyConditionExpressionParts.join(' AND ');
        }
    }, {
        key: 'getQueryExpressionAttributeValues',
        value: function getQueryExpressionAttributeValues() {
            var hashKeyAttribute = this.indexHashKey || this.hashKey;
            var rangeKeyAttribute = this.indexRangeKey || this.rangeKey;

            var expressionAttributeValues = {};
            expressionAttributeValues[':' + hashKeyAttribute] = this.hashKeyValue;
            if (this.rangeKeySpecified && rangeKeyAttribute && this.rangeKeyValue) {
                expressionAttributeValues[':' + rangeKeyAttribute] = this.rangeKeyValue;
            }

            return expressionAttributeValues;
        }
    }, {
        key: 'get',
        value: function get() {
            var _this = this;

            var self = this;

            var params = {};
            params['TableName'] = this.getModelTableName();
            if (this.indexNameSpecified) params['IndexName'] = this.indexName;
            if (this.limitSpecified) params['Limit'] = this.limit;

            if (!this.hashKeySpecified) {
                return new Promise(function (resolve, reject) {
                    _this.dynamoDocClient.scan(params, function (err, data) {
                        if (err) {
                            return reject(err);
                        }

                        var models = data.Items.map(function (item) {
                            var model = self.newModelInstance();
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

            return new Promise(function (resolve, reject) {
                _this.dynamoDocClient.query(params, function (err, data) {
                    if (err) {
                        return reject(err);
                    }

                    var models = data.Items.map(function (item) {
                        var model = self.newModelInstance();
                        model.fill(item);
                        model.setExists();
                        return model;
                    });

                    return resolve(models);
                });
            });
        }
    }, {
        key: 'first',
        value: function first() {
            this.withLimit(1);
            return this.get().then(function (models) {
                return models.length > 0 ? models[0] : null;
            });
        }
    }, {
        key: 'all',
        value: function all() {
            return this.get();
        }
    }]);

    return QueryBuilder;
}();

module.exports = QueryBuilder;