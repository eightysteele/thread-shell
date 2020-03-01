#!/usr/bin/env node

/**
 * @fileoverview This file is the entry point to the Thread shell. It's 
 * powered mainly by the `repl` package: https://nodejs.org/api/repl.html
 */

const repl = require('repl');
const child_process = require('child_process');
const url = require('url');
const client = require("./client");
const database = require("./database");
var pool = null;
const colors = { RED: "31", GREEN: "32", YELLOW: "33", BLUE: "34", MAGENTA: "35" };
const colorize = (color, s) => `\x1b[${color}m${s}\x1b[0m`;
const commandLineArgs = require('command-line-args')

/**
 * Parse the command line options.
 */
const optionDefinitions = [
    { name: 'project_token', type: String },
    { name: 'project_db_name', type: String },
    { name: 'project_db_id', type: String },
]
const options = commandLineArgs(optionDefinitions)
console.log(options);

/**
 * Helper function that prints to the console.
 * @param {string} msg — The message to print.
 * @param {boolean} error — True if the message is an error.
 */
function say(msg, error = false) {
    if (error) {
        msg = colorize(colors.RED, `${msg}`);
    }
    console.log(msg);
    local.displayPrompt();
}

/**
 * User facing function to authenticate to Textile. If credentials are null, 
 * connect to the local daemon. Otherwise authenticate to Textile cloud.
 * @param {Object} creds — The credentials object with `token` and `deviceId` keys.
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
 * Handle a successfull authentication attempt by updating the pool and validating 
 * the connection.
 * @param {@textile/threads-client.Client} client — The Textile client.
 */
function handle_auth(client) {
    say("Authenticated!")
    pool = new database.Pool(client);
    validate_api_connection(client);
    local.context.client = client;

    //@todo clear out options after this
    if (options['project_db_id']) {
        use(options['project_db_name'], id = options['project_db_id']);
    }
}

/**
 * Validate the API connection, existing the shell if it's unreachable.
 * @param {@textile/threads-client.Client} c — The threads client.
 */
function validate_api_connection(threadClient) {
    const textile_url = new url.URL(threadClient.config.host); 
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
            say(`Connected to Textile API: ${threadClient.config.host}`);
        }
    });
}

/**
 * Use a database by name and assign it to the `db` instance in the shell. The 
 * database will be created if it doesn't already exist.
 * @param {string} name — The name of the database.
 */
function use(name, id = null) {
    pool.use(name, 
        id,
        ((db) => {
            local.context.db = new Database(db);
        }),
        ((error) => {
            say(error, true);
        })
    );
}

/**
 * Show a list of databases in the pool.
 */
function show() {
    say(pool.getDbs());
}

/**
 * User facing class that wraps and dispatches to an instance of a 
 * database.Collection. Instances of this class are attached to the
 * `db` object in the shell. For example, if you create a collection
 * named `myCollection` it will be available as `db.myCollection`.
 */
class Collection {
    
    /**
     * @param {*} c — an instance of database.Collection.
     */
    constructor(c) {
        this.c = c;
    }

    /**
     * Create new entities in the collection.
     * @param {Array} entities — The array of entity objects.
     */
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

    /**
     * Save changes to existing entities in the collection.
     * @param {Array} entities — The array of entity objects.
     */
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

    /**
     * Delete existing entities from the collection.
     * @param {Array} ids — The array of entity IDs.
     */
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

    /**
     * Return true if the collection has all the entities.
     * @param {Array} ids — The array of entity IDs.
     */
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

    /**
     * Find entities in the collection.
     * @param {@textile/threads-client.Query} query — The query object. 
     */
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

    /**
     * Get an entity.
     * @param {string} id — The entity ID.
     */
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

    /**
     * Start and return a read-only transaction.
     * @returns {@textile/threads-client.ReadTransaction} — The transaction object.
     */
    readTransaction() {
        return this.c.readTransaction();
    }

    /**
     * Start and return a write-only transaction.
     * @returns {@textile/threads-client.WriteTransaction} — The transaction object.
     */
    writeTransaction() {
        return this.c.writeTransaction();
    }

    /**
     * Listen to actions on an entity.
     * @param {string} id — The entity ID.
     */
    listen(id) {
        this.c.listen(id, ((action) => {
            say(action);
        }));
    }
}

/**
 * User facing class what wraps and dispatches to an instance of a
 * database.DB. It's available in the shell as the `db` object.
 */
class Database {

    /**
     * @param {database.DB} db — The database instance.
     */
    constructor(db) {
        this.db = db;
    }

    /**
     * Create a new database collection.
     * @param {string} name — The collection name.
     * @param {Object} schema — The collection schema.
     */
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

    /**
     * Get the database links.
     */
    getLinks() {
        this.db.getLinks(
            ((result) => {
                say(result);
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

// Authenticate if token is in the command line options
if (options['project_token']) {
    const creds = {
        token: options['project_token'], 
        deviceId: 'fa92b33d-1c17-4f65-b232-acce460b6ad9'}
    auth(creds);
}  

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