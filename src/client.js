Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

const textile_api = require("@textile/textile");
const textile_threads_client = require("@textile/threads-client");

/**
 * Returns a Textile client for the local daemon. If project_token and user_id 
 * are supplied, the client will connect to the Textile cloud. 
 * @param {string} project_token 
 * @param {*} user_id 
 */
async function getCloudClient(creds, cb) {
    const textile = new textile_api.API(creds);
    console.log('WHOA')
    const client = new textile_threads_client.Client(textile.threadsConfig);
    cb(client);
    // textile.start().then(
    //     (result) => {
    //         console.log(threadsConfig);
    //         const client = new textile_threads_client.Client(textile.threadsConfig);
    //     cb(client);
    // }),
    // ((error) => {
    //     console.log(`OOPS ${error}`);
    // });
}

function getLocalClient() {
    return new textile_threads_client.Client();
}

exports.getLocalClient = getLocalClient;
exports.getCloudClient = getCloudClient;