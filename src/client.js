Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

const improbable_transport = require("@improbable-eng/grpc-web-node-http-transport");
const textile_api = require("@textile/textile");
const textile_threads_client = require("@textile/threads-client");

/**
 * Returns a client authenticated against Textile Cloud.
 * @param {Object} creds — Object with `token` and `deviceId` keys. 
 * @param {function} cb — The callback. 
 */
async function getCloudClient(creds, cb) {
    // TODO: Test this against real creds.
    const textile = new textile_api.API(creds);
    textile.threadsConfig.transport = improbable_transport.NodeHttpTransport()
    textile.start().then(
        (result) => {
            const client = new textile_threads_client.Client(textile.threadsConfig);
            cb(client);
        }),
        ((error) => {
            console.log(`TODO ${error}`);
    });
}

/**
 * Returns a client for use with a local Textile daemon.
 */
function getLocalClient() {
    return new textile_threads_client.Client();
}

exports.getLocalClient = getLocalClient;
exports.getCloudClient = getCloudClient;