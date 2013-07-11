var async = require('async');

var redisInstances;

// Send the specified redis command and arguments to the specified redis servers
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

// Get a set of redis client instances and return the ``sendCommand`` method to interact with them
module.exports = function getInstances(instances) {
    redisInstances = instances;
    return sendCommand;
};