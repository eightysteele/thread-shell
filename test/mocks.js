class MockClient {
    async newStore() {
        return this.mockWork({id: "test_id"});
    }
    async registerSchema(id, name, schema) {
        return this.mockWork(name);
    }
    async modelCreate(name, objects) {
        return this.mockWork(objects);
    }
    mockWork(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(data);
            }, 200);
        });
    }
}

exports.MockClient = MockClient;