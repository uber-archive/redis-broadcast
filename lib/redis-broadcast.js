var redisManager = require('redis-manager');
var jsonrpc = require('multitransport-jsonrpc');
var JsonRpcClient = jsonrpc.client;
var ChildProcTransport = jsonrpc.transports.client.childProcess;

function RedisBroadcast(servers, options) {
    options = options || {};
    if(!servers || typeof(servers) !== 'object') throw new Error('Invalid server defintion: ' + servers);

    if(options.useChildProcesses !== false) {
        
    } else {

    }

    return this;
}

module.exports = RedisBroadcast;
