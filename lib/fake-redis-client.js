var async = require('async');
var l = require('lambda-js');

// The FakeClient fakes out the redis client interface and doles out the requests to the real deal in the correct order
// either on process or in the child process
function FakeClient(broadcastObj, queryOrder) {
    this.broadcastObj = broadcastObj;
    this.queryOrder = queryOrder;
    Object.keys(broadcastObj.customMethods).forEach(function(method) {
        this[method] = function() {
            var args = Array.prototype.slice.call(arguments, 0);
            var callback = function() {};
            if(typeof(args[args.length-1]) === 'function') callback = args.pop();
            async.series(this.queryOrder.map(function(queryGroup, i) {
                return function(next) {
                    var sendMethodParent, sendMethod, customMethod;
                    if(queryGroup[Object.keys(queryGroup)[0]] === 'locally') {
                        sendMethodParent = broadcastObj;
                        sendMethod = broadcastObj.sendCommand;
                        customMethod = broadcastObj.customMethods[method][i];
                    } else {
                        sendMethodParent = broadcastObj.childProcClient;
                        sendMethod = broadcastObj.childProcClient.sendCommand;
                        customMethod = broadcastObj.customMethods[method][i];
                        if(customMethod instanceof Function) {
                            customMethod = l.serialize(customMethod);
                        }
                    }
                    sendMethod.call(sendMethodParent, Object.keys(queryGroup), { customMethod: customMethod }, args, next);
                };
            }), callback);
        }.bind(this);
    }.bind(this));
}

// runQuery gets the command, arguments array, and callback function and sets up the series and parallel async
// operations to run as expected across the redis instances
FakeClient.prototype.runQuery = function runQuery(command, args, callback) {
    var broadcastObj = this.broadcastObj;
    async.series(this.queryOrder.map(function(queryGroup) {
        return function(next) {
            var sendMethodParent, sendMethod;
            if(queryGroup[Object.keys(queryGroup)[0]] === 'locally') {
                sendMethodParent = broadcastObj;
                sendMethod = broadcastObj.sendCommand;
            } else {
                sendMethodParent = broadcastObj.childProcClient;
                sendMethod = broadcastObj.childProcClient.sendCommand;
            }
            sendMethod.call(sendMethodParent, Object.keys(queryGroup), command, args, next);
        };
    }), callback);
};

// getRemaining gets a list of all remaining servers
FakeClient.prototype.getRemaining = function getRemaining() {
    var usedServers = Object.keys(this.queryOrder);
    return Object.keys(this.broadcastObj.redisInstances).filter(function(instance) {
        return usedServers.indexOf(instance) === -1;
    });
};

// thenLocally creates a new FakeClient that adds a new set of servers to run commands through in the parent process
FakeClient.prototype.thenLocally = function thenLocally(servers) {
    if(servers === 'remaining') servers = this.getRemaining();
    if(typeof(servers) === 'string') servers = [servers];
    var newQueryOrder = this.queryOrder.map(function(group) {
        return group;
    }).concat(servers.reduce(function(outObj, server) {
        outObj[server] = 'locally';
        return outObj;
    }, {}));
    return new FakeClient(this.broadcastObj, newQueryOrder);
};

// thenTo creates a new FakeClient that adds a new set of servers to run commands through in either the child process
// or if none exists in the "parent" process
FakeClient.prototype.thenTo = function thenTo(servers) {
    if(servers === 'remaining') servers = this.getRemaining();
    if(typeof(servers) === 'string') servers = [servers];
    var newQueryOrder = this.queryOrder.map(function(group) {
        return group;
    }).concat(servers.reduce(function(outObj, server) {
        outObj[server] = 'default';
        return outObj;
    }, {}));
    return new FakeClient(this.broadcastObj, newQueryOrder);
};

// Shamelessly copied from the redis_client we're faking
var commands = ["get", "set", "setnx", "setex", "append", "strlen", "del", "exists", "setbit", "getbit", "setrange", "getrange", "substr",
    "incr", "decr", "mget", "rpush", "lpush", "rpushx", "lpushx", "linsert", "rpop", "lpop", "brpop", "brpoplpush", "blpop", "llen", "lindex",
    "lset", "lrange", "ltrim", "lrem", "rpoplpush", "sadd", "srem", "smove", "sismember", "scard", "spop", "srandmember", "sinter", "sinterstore",
    "sunion", "sunionstore", "sdiff", "sdiffstore", "smembers", "zadd", "zincrby", "zrem", "zremrangebyscore", "zremrangebyrank", "zunionstore",
    "zinterstore", "zrange", "zrangebyscore", "zrevrangebyscore", "zcount", "zrevrange", "zcard", "zscore", "zrank", "zrevrank", "hset", "hsetnx",
    "hget", "hmset", "hmget", "hincrby", "hdel", "hlen", "hkeys", "hvals", "hgetall", "hexists", "incrby", "decrby", "getset", "mset", "msetnx",
    "randomkey", "select", "move", "rename", "renamenx", "expire", "expireat", "keys", "dbsize", "auth", "ping", "echo", "save", "bgsave",
    "bgrewriteaof", "shutdown", "lastsave", "type", "multi", "exec", "discard", "sync", "flushdb", "flushall", "sort", "info", "monitor", "ttl",
    "persist", "slaveof", "debug", "config", "subscribe", "unsubscribe", "psubscribe", "punsubscribe", "publish", "watch", "unwatch", "cluster",
    "restore", "migrate", "dump", "object", "client", "eval", "evalsha"];

// Each redis command is turned into a function that parses the args and calls ``runQuery``
commands.forEach(function(command) {
    FakeClient.prototype[command] = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var callback = function() {};
        if(typeof(args[args.length-1]) === 'function') callback = args.pop();
        this.runQuery(command, args, callback);
    };
});

// Export the FakeClient
module.exports = FakeClient;