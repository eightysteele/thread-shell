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
        const store = await this._getStore(name);
        this._store_in_use = store;
        return store;
    } 

    /**
     * Proxy to js-threads-client.newStore().
     * @param {string} name — The name of the store.
     * @returns {Object} store — The object representing the store.
     */
    async _getStore(name) {
        var store = this._stores.get(name);
        if (store === undefined) {
            store = await this._client.newStore();  
            store.name = name;
            this._stores.set(name, store);
        }
        return store;
    }
}

exports.StoreProxy = StoreProxy;