var redisManager = require('redis-manager');
var jsonrpc = require('multitransport-jsonrpc');
var JsonRpcServer = jsonrpc.server;
var ChildProcTransport = jsonrpc.transports.server.childProcess;

var redisInstance;

var server = new JsonRpcServer(new ChildProcTransport(), {
    configure: function(port, host, options, callback) {
        redisInstance = redisManager.getClient(port, host, options);
        callback(null, true); // TODO: Error handling with redisInstance
    },
    sendCommand: require('./redis-broadcast-common')(redisInstance)
});

server.on('error', process.exit.bind(this, -1));