var when = require('when');
var whenNodeFn = require('when/node/function');

var redisInstances;

function sendCommand(servers, command, args, callback) {
    if(typeof(servers) === 'string') servers = [servers];
    if(!redisInstances[servers[0]][command]) return callback(new Error(command + ' command does not exist'));

    args = args || [];
    when.all(servers.map(function(server) {
        return whenNodeFn.apply(redisInstances[server][command].bind(redisInstances[server]), args);
    })).then(function(result) {
        callback(null, result);
    }, function(err) {
        callback(err, null);
    });
}

module.exports = function getInstances(instances) {
    redisInstances = instances;
    return sendCommand;
};