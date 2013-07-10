var async = require('async');

function FakeClient(broadcastObj, queryOrder) {
    this.broadcastObj = broadcastObj;
    this.queryOrder = queryOrder;
}

FakeClient.prototype.runQuery = function runQuery(command, args, callback) {
    var broadcastObj = this.broadcastObj;
    async.series(this.queryOrder.map(function(queryGroup) {
        return function(next) {
            var parObj = {};
            for(var server in queryGroup) {
                if(queryGroup.hasOwnProperty(server)) {
                    var sendMethodParent, sendMethod;
                    if(queryGroup[server] === 'locally') {
                        sendMethodParent = broadcastObj;
                        sendMethod = broadcastObj.sendCommand;
                    } else {
                        sendMethodParent = broadcastObj.childProcClient;
                        sendMethod = broadcastObj.childProcClient.sendCommand;
                    }
                    parObj[server] = sendMethod.bind(sendMethodParent, server, command, args);
                }
            }
            async.parallel(parObj, next);
        };
    }), callback);
};

FakeClient.prototype.thenLocally = function thenLocally(servers) {
    if(typeof(servers) === 'string') servers = [servers];
    var newQueryOrder = this.queryOrder.map(function(group) {
        return group;
    }).concat(servers.reduce(function(outObj, server) {
        outObj[server] = 'locally';
        return outObj;
    }, {}));
    return new FakeClient(this.broadcastObj, newQueryOrder);
};

FakeClient.prototype.thenTo = function thenTo(servers) {
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

commands.forEach(function(command) {
    FakeClient.prototype[command] = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var callback = function() {};
        if(typeof(args[args.length-1]) === 'function') {
            callback = args.pop();
        }
        this.runQuery(command, args, callback);
    };
});

module.exports = FakeClient;