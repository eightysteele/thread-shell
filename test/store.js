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
    async modelDelete(id, model, object_ids) {
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
    describe("createStore()", function() {
        it("create a non-existing store with mock client", async () => {
            const client = new MockClient();
            const proxy = new store.StoreProxy(client);
            const s = await proxy.getStore("test");
            expect(s.name).equals("test");
            expect(s.id).equals("test_id");
         });
    });
    describe("use()", function() {
        it("use a non-existing store", async () => {
            const client = new MockClient();
            const proxy = new store.StoreProxy(client);
            const s = await proxy.use("test");
            expect(s.name).equals("test");
            expect(s.id).equals("test_id");
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
    describe("deleteModel()", function() {
        it("deletes a model", async () => {
            const client = new MockClient();
            const proxy = new store.StoreProxy(client);
            const s = await proxy.use("test");
            proxy.deleteModel('Person', ["id1", "id2"]);
         });
    });
});