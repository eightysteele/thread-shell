Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

const textile_api = require("@textile/textile");
const textile_threads_client = require("@textile/threads-client");

function getClient(project_token = undefined, user_id = undefined) {
    if ((project_token == undefined) || (user_id == undefined)) {
        return new textile_threads_client.Client();
    } else if ((project_token != undefined) && (user_id != undefined)) {
        const textile = new textile_api.API(project_token, user_id);
        return new textile_threads_client.Client(textile.threadsConfig);
    }
}

exports.getClient = getClient;