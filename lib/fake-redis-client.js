var when = require('when');
var whenCallbacks = require('when/callbacks');
var whenKeys = require('when/keys');

function FakeClient(broadcastObj, queryOrder) {
    this.broadcastObj = broadcastObj;
    this.queryOrder = queryOrder;
}

FakeClient.prototype.runQuery = function runQuery(command, args, callback) {
    var promiseArray = [];
    for(var i = 0; i < this.queryOrder; i++) {
        var promiseObj = {};
        for(var key in this.queryOrder[i]) {
            if(this.queryOrder[i].hasOwnProperty(key)) {
                var sendMethodParent = this.queryOrder[i][key] === 'locally' ? this.broadcastObj : this.broadcastObj.childProcClient;
                var sendMethod = (this.queryOrder[i][key] === 'locally' ? this.broadcastObj.sendCommand : this.broadcastObj.childProcClient.sendCommand).bind(sendMethodParent, key, command);
                promiseObj[key] = whenCallbacks.apply(sendMethod, args);
            }
        }
        promiseArray.push(whenKeys.all(promiseObj));
    }
    var promise = when.all(promiseArray);
    promise.then(function(result) {
        callback(null, result);
    }, function(err) {
        callback(err, null);
    });
};

FakeClient.prototype.thenLocally = function thenLocally(servers) {
    if(typeof(servers) === 'string') servers = [servers];
    var newQueryOrder = this.queryOrder.map(function(group) {
        return group;
    }).push(servers.reduce(function(outObj, server) {
        outObj[server] = 'locally';
        return outObj;
    }, {}));
    return new FakeClient(this.broadcastObj, newQueryOrder);
};

FakeClient.prototype.thenTo = function thenTo(servers) {
    if(typeof(servers) === 'string') servers = [servers];
    var newQueryOrder = this.queryOrder.map(function(group) {
        return group;
    }).push(servers.reduce(function(outObj, server) {
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