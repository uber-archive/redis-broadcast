var redisInstances;

// Send the specified redis command and arguments to the specified redis servers
function sendCommand(server, command, args, callback) {
    if(!redisInstances[server][command]) return callback(new Error(command + ' command does not exist'));
    args = args || [];
    var myArgs = args.slice(0);
    myArgs.push(callback);
    redisInstances[server][command].apply(redisInstances[server], myArgs);
}

// Get a set of redis client instances and return the ``sendCommand`` method to interact with them
module.exports = function getInstances(instances) {
    redisInstances = instances;
    return sendCommand;
};