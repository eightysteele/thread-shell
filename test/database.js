const expect = require("chai").expect;
const database = require("../src/database");
const mocks = require("./mocks");
const client = require("../src/client");


describe("Pool", function() {
    let pool = new database.Pool();
    describe("constructor()", function() {
        it("creates a new Pool", async () => {
            pool.client = new mocks.MockClient();
            expect(pool).to.be.not.undefined;
        });
    });
    describe("use()", function() {
        it("use with mock client", async () => {
            pool.client = new mocks.MockClient();
            pool.use('test', 
                ((db) => {
                    expect(db).to.not.be.undefined;
                    expect(db.id).to.not.be.undefined;
                    expect(db.name).equals('test');
                    expect(pool.active()).equals(db);
                }),
                ((error) => {
                    console.log(`FUCK ${error}`);
                }));
        });
    });
});

describe("DB", function() {
    let pool = new database.Pool();
    describe("createCollection", function() {
        it("creates a new collection", async () => {
            const client = new mocks.MockClient();
            const db = new database.DB(client, 'name', 'id');
            db.createCollection('test', {id: 'c'},
                ((result) => {
                    const c = db.collections.get('test');
                    expect(c).to.not.be.undefined;
                    expect(c.id).equals('c');
                }),
                ((error) => {
                    console.log(`FUCK ${error}`);
                }));
        });
    });
    describe("createEntity", function() {
        it("creates new entities", async () => {
            const client = new mocks.MockClient();
            const db = new database.DB(client, 'name', 'id');
            db.createEntity('c', [{name: 'boom'}],
                ((result) => {
                    expect(result).to.not.be.undefined;
                }),
                ((error) => {
                    console.log(`FUCK ${error}`);
                }));
        });
    });
});