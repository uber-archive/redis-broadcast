var when = require('when');
var whenCallbacks = require('when/callbacks');
var whenKeys = require('when/keys');

function FakeClient(broadcastObj, queryOrder) {
    this.broadcastObj = broadcastObj;
    this.queryOrder = queryOrder;
}

FakeClient.prototype.runQuery = function runQuery(command, args, callback) {
    var promiseArray = [];
    for(var i = 0; i < queryOrder; i++) {
        var promiseObj = {};
        for(var key in queryOrder[i]) {
            if(queryOrder[i].hasOwnProperty(key)) {
                var sendMethod = queryOrder[i][key] === 'locally' ? this.broadcastObj.sendCommand : this.broadcastObj.childProcClient.sendCommand;
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
    var newQueryOrder = queryOrder.map(function(group) {
        return group;
    }).push(servers.reduce(function(outObj, server) {
        outObj[server] = 'locally';
        return outObj;
    }, {}));
    return new FakeClient(this.broadcastObj, newQueryOrder);
};

FakeClient.prototype.thenTo = function thenTo(servers) {
    var newQueryOrder = queryOrder.map(function(group) {
        return group;
    }).push(servers.reduce(function(outObj, server) {
        outObj[server] = 'default';
        return outObj;
    }, {}));
    return new FakeClient(this.broadcastObj, newQueryOrder);
};