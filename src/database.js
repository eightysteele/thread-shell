
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

class Collection {
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
 * Represents a single database.
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
        const promise = this.client.getStoreLinks(this.id);
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
 * Pool of multiple databases.
 */
class Pool {
    
    constructor(client = null, dbs = new Map()) {
        this.client = client;
        this.dbs = new Map();
    }

    use(name, success, failure) {
        var db = this.dbs.get(name);
        if (db) {
            this.dbs.set('active', db);
            success(db);
        } else {
            this.client.newStore().then(
                ((result) => {
                    var db = new DB(this.client, name, result.id);
                    this.dbs.set(name, db);
                    this.dbs.set('active', db);
                    success(db); 
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