var redisManager = require('redis-manager');
var jsonrpc = require('multitransport-jsonrpc');
var JsonRpcClient = jsonrpc.client;
var ChildProcTransport = jsonrpc.transports.client.childProcess;
var fork = require('child_process').fork;

function RedisBroadcast(servers, options) {
    options = options || {};
    if(!servers || typeof(servers) !== 'object') throw new Error('Invalid server defintion: ' + servers);

    this.servers = {};
    if(options.useChildProcesses !== false) {
        Object.keys(servers).forEach(function(server) {
            var conf = servers[server];
            conf.push(function() {}); // TODO: Handle possible errors when child does
            var childServer = new JsonRpcClient(new ChildProcTransport(fork('./redis-broadcast-child.js')));
            childServer.register(['configure', 'sendCommand']);
            childServer.configure.apply(childServer, conf);
            childServer.transport.child.on('error', function() {}); // TODO: child process error handling
            this.servers[server] = childServer;
        });
    } else {
        Object.keys(servers).forEach(function(server) {
            var conf = servers[server];
            var redisInstance = redisManager.getClient.apply(redisManager, conf); // TODO: Handle errors in similar fashion to child process
            this.servers[server] = {
                sendCommand: require('./redis-broadcast-common')(redisInstance)
            };
        });
    }

    return this;
}

RedisBroadcast.prototype.writeTo = function writeTo(servers) {
    // TODO: Get references to all servers to be written to and pass them into a "FakeClient" instance that has stubs to all redis methods
    // as well as the ``thenTo`` method that returns another "FakeClient" instance with chaining added
};

module.exports = RedisBroadcast;
