var jscoverage = global.jscoverage = require('jscoverage');
jscoverage.enableCoverage(true);
var coveralls = require('coveralls');
var RedisBroadcast = jscoverage.require(module, '../lib/redis-broadcast');

// A before all that guarantees that the redis instance
// used during testing is cleared and will not interfere
// with expected results
exports.before = function(test) {
    test.expect(0);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost']
    });
    myServers.writeTo('primary').flushall(function() {
        myServers.shutdown(test.done.bind(test));
    });
};

// A simple, nonsensical use of RedisBroadcast to a single
// server in the current process writes a value correctly.
// A sanity check relevant in early development.
exports.quickCheck = function(test) {
    test.expect(1);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost']
    }, { useChildProcess: false });
    var myWriter = myServers.writeTo('primary');
    myWriter.set('foo', 'bar', function(err, result) {
        test.ok(result);
        myServers.shutdown(test.done.bind(test));
    });
};

// The exact same test as above, but now doing the sanity
// check in the child process.
exports.quickCheckChildProc = function(test) {
    test.expect(1);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost']
    });
    var myWriter = myServers.writeTo('primary');
    myWriter.set('foo', 'bar', function(err, result) {
        test.ok(result);
        myServers.shutdown(test.done.bind(test));
    });
};

// A check that writing locally even if a child process
// is configured will still work.
exports.quickCheckLocallyWithChildProc = function(test) {
    test.expect(1);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost']
    });
    var myWriter = myServers.writeLocally('primary');
    myWriter.set('foo', 'bar', function(err, result) {
        test.ok(result);
        myServers.shutdown(test.done.bind(test));
    });
};

// A check that errors from redis are returned correctly
// through the ``redis-broadcast`` API.
exports.quickCheckFailingWrite = function(test) {
    test.expect(1);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost']
    }, { useChildProcess: false });
    var myWriter = myServers.writeTo('primary');
    myWriter.set('foo', undefined, function(err) {
        test.ok(err);
        myServers.shutdown(test.done.bind(test));
    });
};

// Confirmation that chaining requests functions as expected
exports.fakeChaining = function(test) {
    test.expect(2);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost'],
        secondary: [6379, 'localhost']
    });
    var myWriter = myServers.writeTo('primary').thenTo('secondary');
    myWriter.set('foo', 'bar', function(err, result) {
        test.equal(result.length, 2);
        test.equal(result[0].primary, result[1].secondary);
        myServers.shutdown(test.done.bind(test));
    });
};

// A similar confirmation, but all in the local process
exports.fakeChaining2 = function(test) {
    test.expect(2);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost'],
        secondary: [6379, 'localhost']
    });
    var myWriter = myServers.writeLocally('primary').thenLocally('secondary');
    myWriter.set('foo', 'bar', function(err, result) {
        test.equal(result.length, 2);
        test.equal(result[0].primary, result[1].secondary);
        myServers.shutdown(test.done.bind(test));
    });
};

// Test the custom methods that behave differently between redis servers
exports.customMethods = function(test) {
    test.expect(4);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost'],
        secondary: [6379, 'localhost']
    }, {
        customMethods: {
            setnxOnce: [ function setnxOnce(key, val, callback) {
                this.setnx(key, val, function(err, result) {
                    if(err || !result) {
                        callback(err || new Error('key already set'));
                    } else {
                        callback(null, result);
                    }
                });
            }, 'set' ]
        }
    });
    var myWriter = myServers.writeLocally('primary').thenLocally('secondary');
    myWriter.setnxOnce('test', 'now', function(err, result) {
        test.equal(result.length, 2);
        test.equal(result[0].primary, 1);
        test.equal(result[1].secondary, 'OK');
        myWriter.setnxOnce('test', 'now', function(err) {
            test.ok(!!err);
            myServers.shutdown(test.done.bind(test));
        });
    });
};

exports.customMethods2 = function(test) {
    test.expect(4);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost'],
        secondary: [6379, 'localhost']
    }, {
        customMethods: {
            setnxOnce: [ function setnxOnce(key, val, callback) {
                this.setnx(key, val, function(err, result) {
                    if(err || !result) {
                        callback(err || new Error('key already set'));
                    } else {
                        callback(null, result);
                    }
                });
            }, 'set' ]
        }
    });
    var myWriter = myServers.writeLocally('primary').thenTo('secondary');
    myWriter.setnxOnce('test2', 'now', function(err, result) {
        test.equal(result.length, 2);
        test.equal(result[0].primary, 1);
        test.equal(result[1].secondary, 'OK');
        myWriter.setnxOnce('test2', 'now', function(err) {
            test.ok(!!err);
            myServers.shutdown(test.done.bind(test));
        });
    });
};

exports.customMethods3 = function(test) {
    test.expect(4);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost'],
        secondary: [6379, 'localhost']
    }, {
        customMethods: {
            setnxOnce: [ function setnxOnce(key, val, callback) {
                this.setnx(key, val, function(err, result) {
                    if(err || !result) {
                        callback(err || new Error('key already set'));
                    } else {
                        callback(null, result);
                    }
                });
            }, 'set' ]
        }
    });
    var myWriter = myServers.writeTo('primary').thenTo('secondary');
    myWriter.setnxOnce('test3', 'now', function(err, result) {
        test.equal(result.length, 2);
        test.equal(result[0].primary, 1);
        test.equal(result[1].secondary, 'OK');
        myWriter.setnxOnce('test3', 'now', function(err) {
            test.ok(!!err);
            myServers.shutdown(test.done.bind(test));
        });
    });
};

exports.broadcastAll = function(test) {
    test.expect(5);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost'],
        secondary: [6379, 'localhost', { select: 2 }]
    });
    var myWriter = myServers.writeTo('all');
    myWriter.set('test4', 'blah', function(err, result) {
        test.equal(result.length, 1);
        test.equal(result[0].primary, 'OK');
        test.equal(result[0].secondary, 'OK');
        myWriter.get('test4', function(err, result) {
            test.equal(result[0].primary, 'blah');
            test.equal(result[0].secondary, 'blah');
            myServers.shutdown(test.done.bind(test));
        });
    });
};

exports.broadcastRemaining = function(test) {
    test.expect(5);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost'],
        secondary: [6379, 'localhost', { select: 2 }]
    });
    var myWriter = myServers.writeTo('primary').thenTo('remaining');
    myWriter.set('test5', 'derp', function(err, result) {
        test.equal(result.length, 2);
        test.equal(result[0].primary, 'OK');
        test.equal(result[1].secondary, 'OK');
        myWriter.get('test5', function(err, result) {
            test.equal(result[0].primary, 'derp');
            test.equal(result[1].secondary, 'derp');
            myServers.shutdown({ killChildProc: true }, test.done.bind(test));
        });
    });
};

// Code coverage reporting
exports.jscoverage = function(test) {
    //test.expect(3);
    jscoverage.coverageDetail();
    /*var coverageStats = jscoverage.coverageStats();
    Object.keys(coverageStats).forEach(function(file) {
        test.equal(coverageStats[file].total, coverageStats[file].touched, 'All lines of code exercised by the tests');
    });*/
    if(process.env.TRAVIS) coveralls.handleInput(jscoverage.getLCOV());
    test.done();
};
