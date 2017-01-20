'use strict';


const Expect = require('expect.js');
const Moment = require('moment');
const Model = require('../model');
const User = require('./models/user');


const dynamoDocClient = require('./utils/dynamo-doc-client');


describe('Configuration tests', () => {
    it('Should init correctly', () => {
        const user = new User(dynamoDocClient);

        Expect(user.tableName).to.be('Users');
        Expect(user.hashKey).to.be('email');

        Expect(user.rangeKey).to.be(null);

        Expect(user.timestamps).to.be(true);
        Expect(user.createdAt).to.be.an(Moment);
        Expect(user.updatedAt).to.be.an(Moment);

        // Expect(user.create).to.be.an(Function);
        // Expect(user.update).to.be.an(Function);
        // Expect(user.destroy).to.be.an(Function);

        Expect(user.hasOwnProperty('password')).to.be(true);

        Expect(user.email).to.be(null);
        Expect(user.password).to.be(null);
    });

    it('Should throw no Configuration provided', () => {
        var error = null;

        class User extends Model {}
        try { new User(dynamoDocClient); } catch (e) { error = e; }

        Expect(error).to.not.be(null);
        Expect(error.message).to.contain('config');
    });

    it('Should throw no Table Name defined', () => {
        var error = null;

        class User extends Model {
            config(){}
        }
        try { new User(dynamoDocClient); } catch (e) { error = e; }

        Expect(error).to.not.be(null);
        Expect(error.message).to.contain('Table Name');
    });

    it('Should throw no Hash Key defined', () => {
        var error = null;

        class User extends Model {
            config(){
                this.tableName = 'Users';
            }
        }
        try { new User(dynamoDocClient); } catch (e) { error = e; }

        Expect(error).to.not.be(null);
        Expect(error.message).to.contain('Hash');
    });

    it('Should throw Attributes error', () => {
        var error = null;

        class User extends Model {
            config(){
                this.tableName = 'Users';
                this.hashKey = 'email';
                this.attributes = null;
            }
        }
        try { new User(dynamoDocClient); } catch (e) { error = e; }

        Expect(error).to.not.be(null);
        Expect(error.message).to.contain('Attributes');
    });

    it('Should throw Range Key error', () => {
        var error = null;

        class User extends Model {
            config(){
                this.tableName = 'Users';
                this.hashKey = 'email';
                this.rangeKey = 'email';
            }
        }
        try { new User(dynamoDocClient); } catch (e) { error = e; }

        Expect(error).to.not.be(null);
        Expect(error.message).to.contain('Range');
    });

});