#!/usr/bin/env node

const repl = require('repl');
const child_process = require('child_process');
const url = require('url');
const client = require("./client");
const proxy = require("./proxy")

var threads = client.getLocalClient();
var stores = new proxy.StoreProxy(threads);

// For coloring REPL messages
const colors = { RED: "31", GREEN: "32", YELLOW: "33", BLUE: "34", MAGENTA: "35" };
const colorize = (color, s) => `\x1b[${color}m${s}\x1b[0m`;

/**
 * Logs the supplied message to the REPL.
 * @param {string} msg — The message to print.
 */
function say(msg) {
    console.log(msg);
    local.displayPrompt();  // Cleans up display prompt.
}

/**
 * Checks the connection to the Textile API and exits the shell if the 
 * connection is refused.
 */
function check_textile_api_connection() {
    const textile_url = new url.URL(threads.config.host); 
    const hostname = textile_url.hostname;
    const port = textile_url.port;
    child_process.exec(`nc -vz ${hostname} ${port}`, (error, stdout, stderr) => {
        if (error) {
            var msg = colorize(colors.RED, 
                `Shoot, unable to connect to the Threads API — ${stderr.trim()}`);
            say(msg);   
            process.exit(1);
        }
    });
}

/**
 * 
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

function handle_auth(threads) {
    stores = new proxy.StoreProxy(threads);
    local.context.threads = threads;
    check_textile_api_connection();
}

/**
 * Handles the promises coming back from the js-threads-client API.
 * @param {Promise} promise — The promise. 
 */
function handler(promise) {
    promise.then(
        ((result) => {
            if (result) {
                say(result);
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
 * Returns the active store.
 */
function store() {
    return stores.store();
}

/**
 * Creates a new store.
 */
function newStore() {
    say('Creating new store...');
    handler(stores.newStore());
}

/**
 * Use an existing store by id.
 * @param {string} name — The store name. 
 */
function use(id) {
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
 * Proxy to js-threads-client.registerSchema().
 */
function registerSchema(name, schema) {
    say(`Registering ${name} model schema...`);
    handler(threads.registerSchema(store().id, name, schema));
}

/**
 * Proxy to js-threads-client.modelCreate().
 */
function modelCreate(name, objects) {
    say(`Creating ${name} model objects...`);
    handler(threads.modelCreate(store().id, name, objects));
}

/**
 * Proxy to js-threads-client.modelSave().
 */
function modelSave(name, objects) {
    say(`Saving ${name} model objects...`);
    handler(threads.modelSave(store().id, name, objects));
}

/**
 * Proxy to js-threads-client.modelDelete().
 */
function modelDelete(name, object_ids) {
    say(`Deleting ${name} models by IDs...`);
    handler(threads.modelDelete(store().id, name, object_ids));
}

/**
 * Proxy to js-threads-client.modelFind().
 */
function modelFind(name, query) {
    say(`Finding ${name} models by query...`);
    handler(threads.modelFind(store().id, name, query));
}

/**
 * Proxy to js-threads-client.modelHas().
 */
function modelHas(name, object_ids) {
    say(`Checking if ${name} models exist by IDs...`);
    handler(threads.modelHas(store().id, name, object_ids));
}

/**
 * Proxy to js-threads-client.modelFindByID().
 */
function modelFindByID(name, object_id) {
    say(`Finding ${name} model object by ID...`);
    handler(threads.modelFindByID(store().id, name, object_id));
}

/**
 * Proxy to js-threads-client.readTransaction().
 */
function readTransaction(name) {
    say(`Starting read-only transaction for ${name}...`);
    return threads.readTransaction(store().id, name);
}

/**
 * Proxy to js-threads-client.writeTransaction().
 */
function writeTransaction(name) {
    say(`Starting writeable transaction for ${name}...`);
    return threads.writeTransaction(store().id, name);
}

/**
 * Proxy to js-threads-client.listen().
 */
function listen(name, object_id) {
    say(`Listening to ${name}:${object_id}...`);
    threads.listen(store().id, name, object_id, ((reply) => {
        say(reply);
    }));
}

// Start the REPL
var local = repl.start( {
    prompt: 'threads> ',
    replMode: repl.REPL_MODE_STRICT,
    ignoreUndefined: true,
    useColors: true,
  });

check_textile_api_connection();

// Make stuff available within the REPL context
local.context.threads = threads;
local.context.auth = auth;
local.context.newStore = newStore;
local.context.store = store;
local.context.use = use;
local.context.registerSchema = registerSchema;
local.context.modelCreate = modelCreate;
local.context.modelSave = modelSave;
local.context.modelDelete = modelDelete;
local.context.modelHas = modelHas;
local.context.modelFind = modelFind;
local.context.modelFindByID = modelFindByID;
local.context.readTransaction = readTransaction;
local.context.writeTransaction = writeTransaction;
local.context.listen = listen;
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
      }
}
