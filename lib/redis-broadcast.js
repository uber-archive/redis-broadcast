var redisManager = require('redis-manager');
var jsonrpc = require('multitransport-jsonrpc');
var JsonRpcClient = jsonrpc.client;
var ChildProcTransport = jsonrpc.transports.client.childProcess;
var fork = require('child_process').fork;

var childProc;

function RedisBroadcast(servers, options) {
    options = options || {};
    if(!servers || typeof(servers) !== 'object') throw new Error('Invalid server defintion: ' + servers);

    this.redisInstances = {};
    Object.keys(servers).forEach(function(server) {
        var conf = servers[server];
        this.redisInstances[server] = redisManager.getClient.apply(redisManager, conf); // TODO: Handle errors in similar fashion to child process
    }.bind(this));
    this.sendCommand = require('./redis-broadcast-common')(this.redisInstances);
    
    if(options.useChildProcesses !== false) {
        this.childProcRedisInstances = {};
        if(!childProc) {
            childProc = fork('./redis-broadcast-child.js');
            childProc.on('error', function() {}); // TODO: child process error handling
        }
        this.childProcClient = new JsonRpcClient(new ChildProcTransport(childProc));
        this.childProcClient.register(['getClient', 'freeClient', 'sendCommand']);
        Object.keys(servers).forEach(function(server) {
            var conf = servers[server];
            conf.push(function() {}); // TODO: Handle possible errors when child does
            this.childProcClient.getClient.apply(this.childProcClient, conf);
            this.childProcRedisInstances[server] = childServer;
        }.bind(this));
    } else {
        this.childProcClient = {
            sendCommand: this.sendCommand
        }; // Fake 'remote' calls
    }

    return this;
}

RedisBroadcast.prototype.writeLocally = function writeLocally(servers) {
    
};

RedisBroadcast.prototype.writeTo = function writeTo(servers) {
    // TODO: Get references to all servers to be written to and pass them into a "FakeClient" instance that has stubs to all redis methods
    // as well as the ``thenTo`` method that returns another "FakeClient" instance with chaining added
};

module.exports = RedisBroadcast;
