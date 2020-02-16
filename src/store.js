/**
 * Proxy to the Threads client—handles using multiple stores.
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
        this._active = null;
    }

    /**
     * Return true if store exists, otherwise return false.
     * @param {string} name — The store name. 
     * @returns {boolean} 
     */
    exists(name) {
        return this._stores.has(name);
    }

    /**
     * Use the store by name by activating it, creating it if it doesn't exist.
     * @param {string} name — The name of the store.
     * @returns {Object} store — The object representing the store.
     */
    async use(name) {
        const store = await this.createStore(name);
        this._active = store;
        return this.active();
    } 

    /**
     * Get and return the store by name.
     * @param {string} name — The name of the store.
     * @returns {Object} store — The object representing the store.
     */
    get(name) {
        return this._stores.get(name);
    }

    /**
     * Create and return a new store with the given name—if it already exists, just return it.
     * @param {string} name — The name of the store.
     * @returns {Object} store — The object representing the store.
     */
    async createStore(name) {
        var store = null;
        if (this.exists(name)) {
            store = this.get(name);
        } else {
            store = await this._client.newStore();  
            store.name = name;
            this._stores.set(name, store);
        }
        return store;
    }

    /**
     * Return the active store.
     * @returns {Object} store — The store.
     */
    active() {
        return this._active;
    }

    /**
     * Register the supplied model schema for the active store.
     * @param {string} model — The model name.
     * @param {Object} schema — The model schema.
     */
    registerModel(model, schema) {
        const store = this.active();
        return this._client.registerSchema(store.id, model, schema);
    }

    /**
     * Save a list of objects representing the given model for the active store.
     * @param {string} model — The model name. 
     * @param {Array} objects — The list of model objects. 
     */
    saveModel(model, objects) {
        const store = this.active();
        return this._client.modelSave(store.id, model, objects);
    }

    /**
     * Create a list of objects representing the given model for the active store.
     * @param {string} model — The model name. 
     * @param {Array} objects — The list of model objects. 
     */
    createModel(model, objects) {
        const store = this.active();
        return this._client.modelCreate(store.id, model, objects);
    }
}

exports.StoreProxy = StoreProxy;