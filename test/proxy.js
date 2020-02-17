const expect = require("chai").expect;
const proxy = require("../src/proxy");
var playground = require("../playground");

class MockClient {
    async newStore() {
        return this.mockWork({id: "test_id"});
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
    describe("use()", function() {
        it("use a non-existing store", async () => {
            const threads = new MockClient();
            const stores = new proxy.StoreProxy(threads);
            const s = await stores.use("test");
            expect(s.name).equals("test");
            expect(s.id).equals("test_id");
         });
    });
    describe("createStore()", function() {
        it("create a non-existing store with mock client", async () => {
            const threads = new MockClient();
            const stores = new proxy.StoreProxy(threads);
            const s = await stores._getStore("test");
            expect(s.name).equals("test");
            expect(s.id).equals("test_id");
         });
    });
});