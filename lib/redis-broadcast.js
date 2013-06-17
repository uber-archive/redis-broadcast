var redisManager = require('redis-manager');
var jsonrpc = require('multitransport-jsonrpc');
var JsonRpcClient = jsonrpc.client;
var ChildProcTransport = jsonrpc.transports.client.childProcess;
var fork = require('child_process').fork;
var FakeClient = global.jscoverage ? global.jscoverage.require(module, './fake-redis-client') : require('./fake-redis-client');

var childProc;

function RedisBroadcast(servers, options) {
    options = options || {};
    if(!servers || typeof(servers) !== 'object') throw new Error('Invalid server defintion: ' + servers);

    this.redisInstances = {};
    Object.keys(servers).forEach(function(server) {
        var conf = servers[server];
        this.redisInstances[server] = redisManager.getClient.apply(redisManager, conf); // TODO: Handle errors in similar fashion to child process
    }.bind(this));
    this.sendCommand = (global.jscoverage ? global.jscoverage.require(module, './redis-broadcast-common') : require('./redis-broadcast-common'))(this.redisInstances);
    
    if(options.useChildProcess !== false) {
        this.childProcRedisInstances = {};
        if(!childProc) {
            childProc = fork(__dirname + '/redis-broadcast-child.js');
            childProc.on('error', function() {}); // TODO: child process error handling
        }
        this.childProcClient = new JsonRpcClient(new ChildProcTransport(childProc));
        this.childProcClient.register(['getClient', 'freeClient', 'sendCommand']);
        Object.keys(servers).forEach(function(server) {
            var conf = servers[server];
            conf.unshift(server);
            while(conf.length < 4) {
                conf.push(undefined);
            }
            conf.push(function() {}); // TODO: Handle possible errors when child does
            this.childProcClient.getClient.apply(this.childProcClient, conf);
            this.childProcRedisInstances[server] = true;
        }.bind(this));
    } else {
        this.childProcClient = {
            sendCommand: this.sendCommand
        }; // Fake 'remote' calls
    }

    return this;
}

RedisBroadcast.prototype.writeLocally = function writeLocally(servers) {
    if(typeof(servers) === 'string') servers = [servers];
    var queryOrder = servers.reduce(function(outObj, server) {
        outObj[server] = 'locally';
        return outObj;
    }, {});
    queryOrder = [queryOrder];
    return new FakeClient(this, queryOrder);
};

RedisBroadcast.prototype.writeTo = function writeTo(servers) {
    if(typeof(servers) === 'string') servers = [servers];
    var queryOrder = servers.reduce(function(outObj, server) {
        outObj[server] = 'default';
        return outObj;
    }, {});
    queryOrder = [queryOrder];
    return new FakeClient(this, queryOrder);
};

RedisBroadcast.prototype.shutdown = function shutdown(options, done) {
    if(!done) {
        done = options;
        options = {};
    }
    Object.keys(this.redisInstances).forEach(function(instance) {
        redisManager.freeClient(this.redisInstances[instance]);
    }.bind(this));
    if(this.childProcRedisInstances) {
        Object.keys(this.childProcRedisInstances).forEach(function(instance) {
            this.childProcClient.freeClient(instance, function() {}); // TODO: Error handling
        }.bind(this));
    }
    delete this.redisInstances;
    delete this.sendCommand;
    delete this.childProcClient;
    if(this.childProcRedisInstances) delete this.childProcRedisInstances;
    if(childProc && options.killChildProc) childProc.kill();
    if(done instanceof Function) done();
};

module.exports = RedisBroadcast;
