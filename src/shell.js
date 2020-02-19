#!/usr/bin/env node

const repl = require('repl');
const child_process = require('child_process');
const url = require('url');
const client = require("./client");
const database = require("./database");

var pool = null;

const colors = { RED: "31", GREEN: "32", YELLOW: "33", BLUE: "34", MAGENTA: "35" };
const colorize = (color, s) => `\x1b[${color}m${s}\x1b[0m`;

function say(msg, error = false) {
    if (error) {
        msg = colorize(colors.RED, `${msg}`);
    }
    console.log(msg);
    local.displayPrompt();
}

function auth(creds = null) {
    say('Authenticating...');
    if (creds === null) {
        handle_auth(client.getLocalClient());
    } else {
        client.getCloudClient(creds, handle_auth);
    }
}

function handle_auth(c) {
    say("Authenticated!")
    pool = new database.Pool(c);
    validate_api_connection(c);
}

function validate_api_connection(c) {
    const textile_url = new url.URL(c.config.host); 
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
            say(`Connected to Textile API: ${c.config.host}`);
        }
    });
}

function use(name) {
    pool.use(name, 
        ((db) => {
            local.context.db = new Database(db);
        }),
        ((error) => {
            say(error, true);
        })
    );
}

function show() {
    say(pool.getDbs());
}

class Collection {
    
    constructor(c) {
        this.c = c;
    }

    createEntity(objects) {
        this.c.createEntity(objects, 
            ((result) => {
                say(`Entities created in collection ${this.c.name}`);
            }),
            ((error) => {
                say(error, true);
            })
        );
    }
}

class Database {

    constructor(db) {
        this.db = db;
    }

    createCollection(name, schema) {
        this.db.createCollection(name, schema, 
            ((result) => {
                say(`Collection ${name} created.`);
                const collection = new Collection(result);
                this[name] = collection;
            }),
            ((error) => {
                say(error, true);
            }))
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
local.context.db = null;
local.context.auth = auth;
local.context.show = show;
local.context.Query = client.Query;
local.context.Where = client.Where;
local.context.use = use;
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
      query: new client.Where('firstName').eq('Adam')
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

exports.use = use;
exports.pool = pool;