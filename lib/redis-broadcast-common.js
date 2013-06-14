var when = require('when');
var whenCallbacks = require('when/callbacks');

var redisInstances;

function sendCommand(servers, command, args, callback) {
    if(typeof(servers) === 'string') servers = [servers];
    if(!redisInstance[servers[0]][command]) return callback(new Error(command + ' command does not exist'));

    args = args || [];
    when.all(servers.map(function(server) {
        return whenCallbacks.apply(redisInstance[server][command].bind(redisInstance[server]), args);
    })).then(function(result) {
        callback(null, result);
    }, function(err) {
        callback(err, null);
    });
}

module.exports = function getInstance(instance) {
    redisInstance = instance;
    return sendCommand;
};