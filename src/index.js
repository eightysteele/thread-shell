#!/usr/bin/env node

Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

const repl = require('repl');
const client = require("./client");
const proxy = require("./proxy")

const threads = client.getClient();
const stores = new proxy.StoreProxy(threads);

const colors = { RED: "31", GREEN: "32", YELLOW: "33", BLUE: "34", MAGENTA: "35" };
const colorize = (color, s) => `\x1b[${color}m${s}\x1b[0m`;

function say(msg) {
    console.log(msg);
    local.displayPrompt();
}

var local = repl.start( {
    prompt: 'threads> ',
    replMode: repl.REPL_MODE_STRICT,
    ignoreUndefined: true,
    useColors: true,
  });


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

function store() {
    return stores.store();
}

function use(name) {
    say(`Switching to ${name}...`);
    handler(stores.use(name));
}

function registerSchema(name, schema) {
    say(`Registering ${name} model schema...`);
    handler(threads.registerSchema(store().id, name, schema));
}

function modelCreate(name, objects) {
    say(`Creating ${name} model objects...`);
    handler(threads.modelCreate(store().id, name, objects));
}

function modelSave(name, objects) {
    say(`Saving ${name} model objects...`);
    handler(threads.modelSave(store().id, name, objects));
}

function modelDelete(name, object_ids) {
    say(`Deleting ${name} models by IDs...`);
    handler(threads.modelDelete(store().id, name, object_ids));
}

function modelFind(name, query) {
    say(`Finding ${name} models by query...`);
    handler(threads.modelFind(store().id, name, query));
}

function modelHas(name, object_ids) {
    say(`Checking if ${name} models exist by IDs...`);
    handler(threads.modelHas(store().id, name, object_ids));
}

function modelFindByID(name, object_id) {
    say(`Finding ${name} model object by ID...`);
    handler(threads.modelFindByID(store().id, name, object_id));
}

function readTransaction(name) {
    say(`Starting read-only transaction for ${name}...`);
    return threads.readTransaction(store().id, name);
}

function writeTransaction(name) {
    say(`Starting writeable transaction for ${name}...`);
    return threads.writeTransaction(store().id, name);
}

function listen(name, object_id) {
    say(`Listening to ${name}:${object_id}...`);
    threads.listen(store().id, name, object_id, ((reply) => {
        say(reply);
    }));
}

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




