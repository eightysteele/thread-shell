
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

    createEntity(objects, success, failure) {
        const promise = this.db.client.modelCreate(this.db.id, this.name, objects);
        handler(promise, success, failure);
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