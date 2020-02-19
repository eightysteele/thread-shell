/**
 * Proxy to the Threads client—the main idea is that it handles using multiple
 * stores via the use() method.
 */
class StoreProxy {
    
    /**
     * Constructs a new StoreProxy.
     * @constructor
     * @param {Client} client — The Threads client. 
     * @param {Map} stores — Maps store id to store object. 
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
     * Use the store.
     * @param {string} id — The store id.
     * @returns {Object} store — The object representing the store.
     */
     use(id) {
        var store = this._stores.get(id);
        this._store_in_use = store;
        return store;
    } 

    /**
     * Retun a list of store IDs.
     */
    list() {
        return Array.from(this._stores, ([x]) => x);
    }

    /**
     * Proxy to js-threads-client.newStore().
     * @returns {Object} store — The object representing the store.
     */
    async newStore() {
        var store = await this._client.newStore(); 
        this._stores.set(store.id, store);
        this._store_in_use = store;
        return store;
    }
}

exports.StoreProxy = StoreProxy;