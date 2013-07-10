var async = require('async');

var redisInstances;

function sendCommand(servers, command, args, callback) {
    if(typeof(servers) === 'string') servers = [servers];
    if(!redisInstances[servers[0]][command]) return callback(new Error(command + ' command does not exist'));

    args = args || [];
    async.parallel(servers.map(function(server) {
        var myArgs = args.slice(0);
        return function(next) {
            myArgs.push(next);
            redisInstances[server][command].apply(redisInstances[server], myArgs);
        };
    }), function(err, results) {
        if(err) {
            callback(err, null);
        } else {
            callback(null, results[0]);
        }
    });
}

module.exports = function getInstances(instances) {
    redisInstances = instances;
    return sendCommand;
};