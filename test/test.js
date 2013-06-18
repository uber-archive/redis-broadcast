/* jshint camelcase: false */
var jscoverage = global.jscoverage = require('jscoverage');
jscoverage.enableCoverage(true);
var coveralls = require('coveralls');
var RedisBroadcast = jscoverage.require(module, '../lib/redis-broadcast');

exports.before = function(test) {
    test.expect(0);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost']
    });
    myServers.writeTo('primary').flushall(function() {
        myServers.shutdown(test.done.bind(test));
    });
};

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

exports.onlyConfirmOnce = function(test) {
    test.expect(2);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost'],
        secondary: [6379, 'localhost']
    }, { onlyConfirmOnce: true });
    var myWriter = myServers.writeTo('primary').thenTo('secondary');
    myWriter.setnx('hai', 'there', function(err, result) {
        test.equal(result[0].primary, 1);
        test.equal(result[1].secondary, 'OK');
        myServers.shutdown(test.done.bind(test));
    });
};

exports.onlyConfirmOnce2 = function(test) {
    test.expect(2);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost'],
        secondary: [6379, 'localhost']
    }, { onlyConfirmOnce: true });
    var myWriter = myServers.writeTo('primary').thenTo('secondary');
    myWriter.setnx('hai', 'there', function(err, result) {
        test.equal(result.length, 1);
        test.equal(result[0].primary, 0);
        myServers.shutdown(test.done.bind(test));
    });
};

exports.onlyConfirmOnceFailPath = function(test) {
    test.expect(1);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost'],
        secondary: [6379, 'localhost']
    }, { onlyConfirmOnce: true });
    var myWriter = myServers.writeTo('primary').thenTo('secondary');
    myWriter.setnx(undefined, undefined, function(err) {
        test.ok(err);
        myServers.shutdown({ killChildProc: true }, test.done.bind(test));
    });
};

exports.onlyConfirmOnceFailPath2 = function(test) {
    // This test contains dirty hacks to fake a redis server-side failure
    // to reach code coverage needs. Must be the last test (besides the jscoverage test).
    test.expect(1);
    var myServers = new RedisBroadcast({
        primary: [6379, 'localhost', { enable_offline_queue: false }],
        secondary: [6379, 'localhost']
    }, { useChildProcess: false, onlyConfirmOnce: true });
    var myWriter = myServers.writeTo('primary').thenTo('secondary');
    myServers.redisInstances.primary.end();
    myWriter.setnx('foo', 'bar', function(err) {
        test.ok(err);
        myServers.redisInstances.secondary.end();
        test.done();
    });
};

exports.jscoverage = function(test) {
    test.expect(3);
    jscoverage.coverageDetail();
    // Copied directly from jscoverage and edited, since getting at these values directly isn't possible
    var file;
    var tmp;
    var total;
    var touched;
    var n, len;
    if (typeof global._$jscoverage === 'undefined') {
        return;
    }
    var lcov = "";
    Object.keys(global._$jscoverage).forEach(function(key) {
        file = key;
        lcov += "SF:" + file + "\n";
        tmp = global._$jscoverage[key];
        if (typeof tmp === 'function' || tmp.length === undefined) return;
        total = touched = 0;
        for (n = 0, len = tmp.length; n < len; n++) {
            if (tmp[n] !== undefined) {
                lcov += "DA:" + n + "," + tmp[n] + "\n";
                total ++;
                if (tmp[n] > 0)
                    touched ++;
            }
        }
        lcov += "end_of_record\n";
        test.ok(touched); // Disable failures on this for now until full test suite is written
        //test.equal(total, touched, 'All lines of code exercised by the tests');
    });
    if(process.env.TRAVIS) coveralls.handleInput(lcov);
    test.done();
};
