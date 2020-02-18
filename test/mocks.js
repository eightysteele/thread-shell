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

exports.MockClient = MockClient;