/**
 * @fileoverview This file contains abstractions for a database (DB), a 
 * collection (Collection), and a pool (Pool) of databases. These abstractions
 * wrap and dispatch to a @textile/threads-client.Client and contain no business
 * logic. The pool maintains multiple database instances by name.
 * @package database
 */

/**
 * General handler for promises coming back from the client.
 * @param {Promise} promise — The promise.
 * @param {function} success — The success callback.
 * @param {function} failure — The failure callback.
 */
function handler(promise, success, failure) {
    promise.then(
        ((result) => {
            success(result);
        }),
        ((error) => {
            failure(error);
        })
    );
}

/**
 * Represents a single collection and has a reference to its database.
 */
class Collection {
    /**
     * @param {DB} db — The DB this collection belongs to.
     * @param {string} name — The collection name.
     * @param {Object} schema — The collection schema.
     */
    constructor(db, name, schema){
        this.db = db;
        this.name = name;
        this.schema = schema;
    }

    create(entities, success, failure) {
        const promise = this.db.client.modelCreate(this.db.id, this.name, entities);
        handler(promise, success, failure);
    }

    save(entities, success, failure) {
        const promise = this.db.client.modelSave(this.db.id, this.name, entities);
        handler(promise, success, failure);
    }

    delete(ids, success, failure) {
        const promise = this.db.client.modelDelete(this.db.id, this.name, ids);
        handler(promise, success, failure);
    }

    has(ids, success, failure) {
        const promise = this.db.client.modelHas(this.db.id, this.name, ids);
        handler(promise, success, failure);
    }

    find(query, success, failure) {
        const promise = this.db.client.modelFind(this.db.id, this.name, query);
        handler(promise, success, failure);
    }

    get(id, success, failure) {
        const promise = this.db.client.modelFind(this.db.id, this.name, id);
        handler(promise, success, failure);
    }

    readTransaction() {
        return this.db.client.readTransaction(this.db.id, this.name);
    }

    writeTransaction() {
        return this.db.client.writeTransaction(this.db.id, this.name);
    }

    listen(id, callback) {
        this.db.client.listen(this.db.id, this.name, id, callback); 
    }
}

/**
 * Represents a single database and has a reference to the Textile cient.
 */
class DB {
    constructor(client, name, id, collections = new Map()) {
        this.client = client;
        this.name = name;
        this.id = id;
        this.collections = collections;
    }

    createCollection(name, schema, success, failure) {
        const promise = this.client.registerSchema(this.id, name, schema);
        const collection = new Collection(this, name, schema);
        this.collections.set(name, schema);
        this[name] = collection;
        promise.then(
            ((result) => {
                success(collection);
            }),
            ((error) => {
                failure(error);
            })
        );
    }

    getLinks(success, failure) {
        const promise = this.client.getStoreLink(this.id);
        promise.then(
            ((result) => {
                success(result);
            }),
            ((error) => {
                failure(error);
            })
        );
    }
}

/**
 * Represents a pool of databases identified by name and has a reference to a
 * Textile client.
 */
class Pool {
    
    constructor(client = null, dbs = new Map()) {
        this.client = client;
        this.dbs = new Map();
    }



    /**
     * Use a database, creating one if it doesn't exist, and starting it.
     * @param {string} name — The name of the database.
     * @param {function} success — The success callback.
     * @param {function} failure — The failure callback.
     */
    use(name, id = null, success, failure) {
        const client = this.client;
        var db = this.dbs.get(name);
        var newDbId = null;
        if (db) {
            this.dbs.set('active', db);
            success(db);
        } else if (id) {
            client.start(id).then(
                ((result) => {
                    var db = new DB(this.client, name, id);
                    this.dbs.set(name, db);
                    this.dbs.set('active', db);
                    success(db);
                }),
                ((error) => {
                    failure(error);
                })
            );
        } else {
            client.newStore().then(
                ((result) => {
                    var db = new DB(this.client, name, result.id);
                    newDbId = result.id;
                    this.dbs.set(name, db);
                    this.dbs.set('active', db);
                    success(db); 
                }),
                ((error) => {
                    failure(error);
                })
            ).then(
                (() => {
                    client.start(newDbId);
                }),
                ((error) => {
                    failure(error);
                })
            );
        }
    }

    active() {
        return this.dbs.get('active');
    }

    getDbs() {
        return this.dbs;
    }
}

exports.Pool = Pool;
exports.DB = DB;