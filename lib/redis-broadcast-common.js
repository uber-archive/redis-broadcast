var redisInstances, customMethods;

// Send the specified redis command and arguments to the specified redis servers
function sendCommand(server, command, args, callback) {
    args = args || [];
    var myArgs = args.slice(0);
    myArgs.push(callback);
    if(typeof(command) === 'string') {
        redisInstances[server][command].apply(redisInstances[server], myArgs);
    } else if(command.customMethod && command.customMethod instanceof Function) {
        command.customMethod.apply(redisInstances[server], myArgs);
    } else if(command.customMethod && typeof(command.customMethod) === 'string') {
        redisInstances[server][command.customMethod].apply(redisInstances[server], myArgs);
    } else {
        throw new Error(command + ' is not a valid command!');
    }
}

// Get a set of redis client instances and return the ``sendCommand`` method to interact with them
module.exports = function getInstances(instances, methods) {
    redisInstances = instances;
    customMethods = methods;
    return sendCommand;
};