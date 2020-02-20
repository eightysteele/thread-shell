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

function handle_auth(client) {
    say("Authenticated!")
    pool = new database.Pool(client);
    validate_api_connection(client);
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

    create(entities) {
        this.c.create(entities, 
            ((result) => {
                say(`Entities created in collection ${this.c.name}`);
            }),
            ((error) => {
                say(error, true);
            })
        );
    }

    save(entities) {
        this.c.save(entities, 
            ((result) => {
                say(`Entities saved to collection ${this.c.name}`);
            }),
            ((error) => {
                say(error, true);
            })
        );
    }

    delete(ids) {
        this.c.delete(ids, 
            ((result) => {
                say(`Entities deleted from collection ${this.c.name}`);
            }),
            ((error) => {
                say(error, true);
            })
        );
    }

    has(ids) {
        this.c.has(ids, 
            ((result) => {
                say(result);
            }),
            ((error) => {
                say(error, true);
            })
        );
    }

    find(query) {
        this.c.find(query, 
            ((result) => {
                say(result);
            }),
            ((error) => {
                say(error, true);
            })
        );
    }

    get(id) {
        this.c.get(id, 
            ((result) => {
                say(result);
            }),
            ((error) => {
                say(error, true);
            })
        );
    }

    readTransaction() {
        return this.c.readTransaction();
    }

    writeTransaction() {
        return this.c.writeTransaction();
    }

    listen(id) {
        this.c.listen(id, ((action) => {
            say(action);
        }));
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

    getLinks() {
        this.db.getLinks(
            ((result) => {
                say(results);
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
auth(creds?: Object)     
    Authenticate to Textile cloud with credentials, or to the local daemon.
use(name: String)
    Use the database by name creating it if it doesn't exist.
show()
    Show a list of databases.
db
    The active database in use.
db.createCollection(name: String, schema: Object)
    Create a new collection in the database.
db.getLinks()
    Get links for the database.
db.collectionName.create(entities: Array)
    Create new entities in the database collection.
db.collectionName.delete(ids: Array)
    Delete entities from the database collection.
db.collectionName.find(query: Where | Query)
    Find entities in the database collection.
db.collectionName.get(id: String)
    Get an entity by id from the database collection.
db.collectionName.has(ids: Array)
    Return true if the database collection has all the entities.
db.collectionName.listen(id: String)
    Listen to entity updates in the database collection.
db.collectionName.readTransaction()
    Start and return a read-only transaction.
db.collectionName.save(entities: Array)
    Save entities in the database collection.
db.collectionName.writeTransaction()
    Start and return a write-only transaction.
Query
    The js-threads-client Query object for building store queries.
Where
    The js-threads-client Where object for building store queries.
`
    say(msg);
}

exports.use = use;
exports.pool = pool;
exports.help = help;