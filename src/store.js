/**
 * Proxy to the Threads client—the main idea is that it handles using multiple
 * stores via the use() method, where each store is identified by a name.
 */
class StoreProxy {
    
    /**
     * Constructs a new StoreProxy.
     * @constructor
     * @param {Client} client — The Threads client. 
     * @param {Map} stores — Maps store name to store object. 
     */
    constructor(client, stores = new Map()) {
        this._client = client;
        this._stores = stores;
        this._store_in_use = null;
    }

     /**
     * Return the store currently in use.
     * @returns {Object} store — The store.
     */
    store() {
        return this._store_in_use;
    }

    /**
     * Use the store by name by activating it, creating it if it doesn't exist.
     * @param {string} name — The name of the store.
     * @returns {Object} store — The object representing the store.
     */
    async use(name) {
        const store = await this.getStore(name);
        this._store_in_use = store;
        return store;
    } 

    /**
     * Proxy to js-threads-client.newStore().
     * @param {string} name — The name of the store.
     * @returns {Object} store — The object representing the store.
     */
    async getStore(name) {
        var store = this._stores.get(name);
        if (store === undefined) {
            store = await this._client.newStore();  
            store.name = name;
            this._stores.set(name, store);
        }
        return store;
    }

    /**
     * Proxy to js-threads-client.registerSchema(). 
     * @param {string} model — The model name.
     * @param {Object} schema — The model schema.
     */
    registerModel(model, schema) {
        const store = this._store_in_use;
        return this._client.registerSchema(store.id, model, schema);
    }

    /**
     * Proxy to js-threads-client.modelCreate(). 
     * @param {string} model — The model name. 
     * @param {Array} objects — The list of model objects. 
     */
    createModel(model, objects) {
        const store = this._store_in_use;
        return this._client.modelCreate(store.id, model, objects);
    }

    /**
     * Proxy to js-threads-client.modelSave(). 
     * @param {string} model — The model name. 
     * @param {Array} objects — The list of model objects. 
     */
    saveModel(model, objects) {
        const store = this._store_in_use;
        return this._client.modelSave(store.id, model, objects);
    }
    
    /**
     * Proxy to js-threads-client.modelDelete(). 
     * @param {string} name — The model name. 
     * @param {Array} object_ids — The list of model object ids.
     */
    deleteModel(name, object_ids) {
        const store = this._store_in_use;
        return this._client.modelDelete(store.id, name, object_ids);
    }

    /**
     * Proxy to js-threads-client.modelFind(). 
     * @param {string} name — The model name.
     * @param {Object} query — The query object.
     */
    search(name, query) {
        const store = this._store_in_use;
        return this._client.modelFind(store.id, name, query);
    }
}

exports.StoreProxy = StoreProxy;