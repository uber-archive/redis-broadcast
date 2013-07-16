var redisManager = require('redis-manager');
var jsonrpc = require('multitransport-jsonrpc');
var JsonRpcServer = jsonrpc.server;
var ChildProcTransport = jsonrpc.transports.server.childProcess;

var redisInstances = {};
var customMethods = {};

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
    customMethods: function(methodMap, callback) {
        Object.keys(methodMap).forEach(function(method) {
            // Copy to customMethods object so sendCommand always has the latest version
            customMethods[method] = methodMap[method];
        });
        callback(null, true); // TODO: Error handling if methodMap doesn't contain JS functions
    },
    sendCommand: require('./redis-broadcast-common')(redisInstances, customMethods)
});

// And die on any RPC transport errors, if that ever happens
server.transport.on('error', process.exit.bind(this, -1));