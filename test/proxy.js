const expect = require("chai").expect;
const proxy = require("../src/proxy");
const playground = require("../playground");
const mocks = require("./mocks");

describe("StoreProxy", function() {
    describe("constructor()", function() {
        it("create a new StoreProxy", async () => {
            const threads = new mocks.MockClient();
            const stores = new proxy.StoreProxy(threads);
            expect(stores).not.null;
         });
    });
    describe("newStore() mock", function() {
        it("create a new store", async () => {
            const threads = new mocks.MockClient();
            const stores = new proxy.StoreProxy(threads);
            const s = await stores.newStore();
            expect(s.id).equals("test_id");
         });
    });
    describe("use()", function() {
        it("use stores", async () => {
            const threads = new mocks.MockClient();
            const stores = new proxy.StoreProxy(threads);
            const s = await stores.newStore();
            var s1 = await stores.use(s.id);
            expect(s.id).equals(s1.id);
         });
    });
    describe("list()", function() {
        it("list stores", async () => {
            const threads = new mocks.MockClient();
            const stores = new proxy.StoreProxy(threads);
            const s = await stores.newStore();
            const all = stores.list()
            expect(s.id).equals(all[0]);
         });
    });
});