#!/usr/bin/env node

const repl = require('repl');
const child_process = require('child_process');
const url = require('url');
const client = require("./client");
const proxy = require("./proxy")
const tc = require("@textile/threads-client");


// For coloring REPL messages
const colors = { RED: "31", GREEN: "32", YELLOW: "33", BLUE: "34", MAGENTA: "35" };
const colorize = (color, s) => `\x1b[${color}m${s}\x1b[0m`;

/**
 * Helper that logs the supplied message to the REPL.
 * @param {string} msg — The message to print.
 */
function say(msg) {
    console.log(msg);
    local.displayPrompt();  // Cleans up display prompt.
}

/**
 * Helper that checks the connection to the Textile API and will exit the shell 
 * if the connection is refused.
 */
function check_textile_api_connection(threads) {
    const textile_url = new url.URL(threads.config.host); 
    const hostname = textile_url.hostname;
    const port = textile_url.port;
    // TODO: is `nc` reliable cross-platform?
    child_process.exec(`nc -vz ${hostname} ${port}`, (error, stdout, stderr) => {
        if (error) {
            var msg = colorize(colors.RED, 
                `Shoot, unable to connect to the Threads API — ${stderr.trim()}`);
            say(msg);   
            process.exit(1);
        } else {
            say(`Connected to Textile API: ${threads.config.host}`);
        }
    });
}

/**
 * Authenticates to the Textile API.
 * @param {Object} creds — Object with `token` and `deviceId` keys. 
 */
function auth(creds = null) {
    say('Authenticating...');
    if (creds === null) {
        handle_auth(client.getLocalClient());
    } else {
        client.getCloudClient(creds, handle_auth);
    }
}

/**
 * Wires up the supplied threads client to the REPL.
 * @param {Client} threads — The Threads client
 */
function handle_auth(threads) {
    say("Authenticated!")
    const stores = new proxy.StoreProxy(threads);
    const store = new Store(stores);
    local.context.store = store;
    local.context.threads = threads;
    check_textile_api_connection(threads);
}

/**
 * Generic handler for promises coming back from the js-threads-client API.
 * @param {Promise} promise — The promise.
 * @param {Function} cb — Optional callback for the results. 
 */
function handler(promise, cb = () => {}) {
    promise.then(
        ((result) => {
            if (result) {
                say(result);
                cb(result);
            } else {
                say(`Success`);
            }
        }),
        ((error) => {
            var msg = colorize(colors.RED, `${error}`);
            say(msg);
        })
    );
}

/**
 * Create a new store.
 */
function newStore() {
    const stores = local.context.store.stores;
    say('Creating new store...');
    handler(stores.newStore());
}

/**
 * Use an existing store by id.
 * @param {string} id — The store id. 
 */
function use(id) {
    const stores = local.context.store.stores;
    say(`Switching stores...`);
    var store = stores.use(id);
    if (store === undefined) {
        var msg = colorize(colors.RED, `Invalid store id: ${id}`);
        say(msg);
    } else {
        say(store);
    }
}

/**
 * Shows a list of store IDs.
 */
function showStores() {
    const stores = local.context.store.stores;
    say(stores.list());
}

/**
 * Proxies js-threads-client, but keeps track of multiple stores.
 */
class Store {

    /**
     * Constructs a new Store with the supplied store proxy object.
     * @param {StoreProxy} stores — The store proxy. 
     */
    constructor(stores) {
        this.stores = stores;
        this.threads = stores._client;
    }

    /**
     * Returns the active store id.
     */
    id() {
        return this.stores.store().id;
    }

    /**
     * Proxy to js-threads-client.registerSchema().
     */
    registerSchema(name, schema) {
        say(`Registering ${name} model schema...`);
        handler(this.threads.registerSchema(this.id(), name, schema));
    }

    /**
     * Proxy to js-threads-client.modelCreate().
     */
    modelCreate(name, objects) {
        say(`Creating ${name} model objects...`);
        handler(this.threads.modelCreate(this.id(), name, objects));
    }

    /**
     * Proxy to js-threads-client.modelSave().
     */
    modelSave(name, objects) {
        say(`Saving ${name} model objects...`);
        handler(this.threads.modelSave(this.id(), name, objects));
    }

    /**
     * Proxy to js-threads-client.modelDelete().
     */
    modelDelete(name, object_ids) {
        say(`Deleting ${name} models by IDs...`);
        handler(this.threads.modelDelete(this.id(), name, object_ids));
    }

    /**
     * Proxy to js-threads-client.modelFind().
     */
    modelFind(name, query) {
        say(`Finding ${name} models by query...`);
        handler(this.threads.modelFind(this.id(), name, query));
    }

    /**
     * Proxy to js-threads-client.modelHas().
     */
    modelHas(name, object_ids) {
        say(`Checking if ${name} models exist by IDs...`);
        handler(this.threads.modelHas(this.id(), name, object_ids));
    }

    /**
     * Proxy to js-threads-client.modelFindByID().
     */
    modelFindByID(name, object_id) {
        say(`Finding ${name} model object by ID...`);
        handler(this.threads.modelFindByID(this.id(), name, object_id));
    }

    /**
     * Proxy to js-threads-client.readTransaction().
     */
    readTransaction(name) {
        say(`Starting read-only transaction for ${name}...`);
        return this.threads.readTransaction(this.id(), name);
    }

    /**
     * Proxy to js-threads-client.writeTransaction().
     */
    writeTransaction(name) {
        say(`Starting writeable transaction for ${name}...`);
        return this.threads.writeTransaction(this.id(), name);
    }

    /**
     * Proxy to js-threads-client.listen().
     */
    listen(name, object_id) {
        say(`Listening to ${name}:${object_id}...`);
        this.threads.listen(this.id(), name, object_id, ((reply) => {
            say(reply);
        }));
    }
}

// Start the REPL
var local = repl.start( {
    prompt: 'threads> ',
    replMode: repl.REPL_MODE_STRICT,
    ignoreUndefined: true,
    useColors: true,
  });

// Make stuff available within the REPL context
local.context.auth = auth;
local.context.Query = tc.Query;
local.context.Where = tc.Where;
local.context.newStore = newStore;
local.context.use = use;
local.context.showStores = showStores;
local.context.help = help;
local.context.playground = {
    model: "Person",
    schema: {
        "$id": "https://example.com/person.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Person",
        "type": "object",
        "properties": {
          "firstName": {
            "type": "string",
            "description": "The person's first name."
          },
          "lastName": {
            "type": "string",
            "description": "The person's last name."
          },
          "age": {
            "description": "Age in years which must be equal to or greater than zero.",
            "type": "integer",
            "minimum": 0
          }
        }
      },
      adam: {
        "firstName": "Adam",
        "lastName": "Doe",
        "age": 21
      },
      eve: {
        "firstName": "Eve",
        "lastName": "Doe",
        "age": 21
      },
      query: new tc.Where('firstName').eq('Adam')
}

/**
 * Shows help message.
 */
function help() {
    var msg = `
auth(creds)     
    Authenticate to Textile cloud with credentials.
newStore()      
    Create a new store.
showStores()    
    List all stores.
use(id)         
    Use the store (makes the store active).
store
    The store that's active—you make stores active with use(id)
store.id()      
    Get the store's id.
store.registerSchema(name, schema)
    Register the name of a model to the supplied schema.
store.modelCreate(name, objects)
    Create new objects for the supplied model name.
store.modelSave(name, objects)
    Save changes to existing objects for the supplied model name.
store.modelDelete(name, object_ids)
    Delete existing objects by ID for the supplied model name.
store.modelFind(name, query)
    Find objects for the supplied model name and query object.
store.modelHas(name, object_ids)
    Check if a model has specific objects.
store.modelFindByID(name, object_id)
    Find objects by ID for the supplied model name and list of IDs.
store.readTransaction(name)
    Create a new read-only transaction object.
store.writeTransaction(name) 
    Create a new writable transaction object.
store.listen(name, object_id)
    Listen to updates on the supplied object id.
playground
    Playground object with a model name, schema, and objects to play with.
Query
    The js-threads-client Query object for building store queries.
Where
    The js-threads-client Where object for building store queries.
`
    say(msg);
}