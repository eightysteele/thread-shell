const expect = require("chai").expect;
const store = require("../src/store");
var playground = require("../playground");

class MockClient {
    async newStore() {
        return this.mockWork({id: "test_id"});
    }
    async registerSchema(id, model, objects) {
        return this.mockWork();
    }
    async modelCreate(id, model, objects) {
        return this.mockWork();
    }
    mockWork(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(data);
            }, 200);
        });
    }
}

describe("StoreManager", function() {
    describe("exists()", function() {
        it("return false for a non-existing store", function() {
            const proxy = new store.StoreProxy(null);
            expect(proxy.exists("foo")).false; 
         });
         it("return true for an existing store", function() {
            const stores = new Map();
            stores.set("foo", {});
            const proxy = new store.StoreProxy(null, stores);
            expect(proxy.exists("foo")).true; 
         });
    });
    describe("get()", function() {
        it("return false for a non-existing store", function() {
            const stores = new Map();
            const proxy = new store.StoreProxy(null, stores);
            expect(proxy.get("foo")).undefined; 
         });
         it("return true for an existing store", function() {
            const stores = new Map();
            const x = {id: "bar"};
            stores.set("foo", x);
            const proxy = new store.StoreProxy(null, stores);
            expect(proxy.get("foo")).equal(x); 
         });
    });
    describe("createStore()", function() {
        it("create a non-existing store with mock client", async () => {
            const client = new MockClient();
            const proxy = new store.StoreProxy(client);
            const s = await proxy.createStore("test");
            expect(s.name).equals("test");
            expect(s.id).equals("test_id");
            expect(proxy.get("test")).equal(s);
         });
    });
    describe("use()", function() {
        it("use a non-existing store", async () => {
            const client = new MockClient();
            const proxy = new store.StoreProxy(client);
            const s = await proxy.use("test");
            expect(s.name).equals("test");
            expect(s.id).equals("test_id");
            expect(proxy.get("test")).equal(s);
         });
    });
    describe("registerModel()", function() {
        it("register against a store", async () => {
            const client = new MockClient();
            const proxy = new store.StoreProxy(client);
            const s = await proxy.use("test");
            proxy.registerModel('Person', playground.personSchema);
         });
    });
    describe("createModel()", function() {
        it("register against a store", async () => {
            const client = new MockClient();
            const proxy = new store.StoreProxy(client);
            const s = await proxy.use("test");
            proxy.createModel('Person', [playground.adam, playground.eve]);
         });
    });
});