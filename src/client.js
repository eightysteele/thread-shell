Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

const textile_api = require("@textile/textile");
const textile_threads_client = require("@textile/threads-client");

/**
 * Returns a Textile client for the local daemon. If project_token and user_id 
 * are supplied, the client will connect to the Textile cloud. 
 * @param {string} project_token 
 * @param {*} user_id 
 */
function getClient(project_token = undefined, user_id = undefined) {
    if ((project_token == undefined) || (user_id == undefined)) {
        return new textile_threads_client.Client();
    } else if ((project_token != undefined) && (user_id != undefined)) {
        const textile = new textile_api.API(project_token, user_id);
        return new textile_threads_client.Client(textile.threadsConfig);
    }
}

exports.getClient = getClient;