var redisManager = require('redis-manager');
var jsonrpc = require('multitransport-jsonrpc');
var JsonRpcServer = jsonrpc.server;
var ChildProcTransport = jsonrpc.transports.server.childProcess;

var redisInstances = {};

// Implement a simple server that exposes the ``redis-manager`` API over RPC
// and implements a ``sendCommand`` method for using the underlying redis library
var server = new JsonRpcServer(new ChildProcTransport(), {
    getClient: function(name, port, host, options, callback) {
        redisInstances[name] = redisManager.getClient(port, host, options);
        callback(null, true); // TODO: Error handling with redisInstance
    },
    freeClient: function(name, callback) {
        callback(null, redisManager.freeClient(redisInstances[name]));
        delete redisInstances[name];
    },
    sendCommand: require('./redis-broadcast-common')(redisInstances)
});

// And die on any RPC transport errors, if that ever happens
server.transport.on('error', process.exit.bind(this, -1));