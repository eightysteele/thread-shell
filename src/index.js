#!/usr/bin/env node

Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

const repl = require('repl');
const store = require("../src/store");
const client = require("../src/client");

const textile = client.getClient();
const proxy = new store.StoreProxy(textile);

function use(name) {
    return proxy.use(name);
}

function db() {
    return proxy.active();
}

function register(model, schema) {
    return proxy.register(model, schema);
}

function save(model, objects) {
    return proxy.save(model, objects);
}

var local = repl.start(">>> ");
local.context.client = textile;
local.context.use = use;
local.context.db = db;
local.context.register = register;
local.context.save = save;
