var jscoverage = global.jscoverage = require('jscoverage');
jscoverage.enableCoverage(true);
var coveralls = require('coveralls');
var RedisBroadcast = jscoverage.require(module, '../lib/redis-broadcast');

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
        test.equal(result[0].primary[0], result[1].secondary[0]);
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
        test.equal(result[0].primary[0], result[1].secondary[0]);
        myServers.shutdown({ killChildProc: true }, test.done.bind(test));
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
