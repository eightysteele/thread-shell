#!/usr/bin/env node

Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

const repl = require('repl');
const client = require("./client");
const proxy = require("./proxy")

const threads = client.getClient();
const stores = new proxy.StoreProxy(threads);

// Some helpers for coloring REPL messages.
const colors = { RED: "31", GREEN: "32", YELLOW: "33", BLUE: "34", MAGENTA: "35" };
const colorize = (color, s) => `\x1b[${color}m${s}\x1b[0m`;

/**
 * A little helper function that "says" the supplied message in the REPL.
 * @param {string} msg — The message to print.
 */
function say(msg) {
    console.log(msg);
    local.displayPrompt();  // Cleans up display prompt.
}

/**
 * A little helper function that handles the promises coming back from the 
 * js-threads-client API.
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
            var msg = colorize(colors.RED, `Hit a snag, try again: ${error}`);
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
 * Use the supplied store by name. Creates it if it doesn't exist.
 * @param {string} name — The store name. 
 */
function use(name) {
    say(`Switching to ${name}...`);
    handler(stores.use(name));
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
 * Proxy to js-threads-client.modelFin().
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

// Make thread functions available to the REPL context
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
