var async = require('async');
var redisInstances, customMethods;

// Send the specified redis command and arguments to the specified redis servers
function sendCommand(servers, command, args, callback) {
    servers = Array.isArray(servers) ? servers : [servers];
    args = args || [];
    var methodToRun;
    if(typeof(command) === 'string') {
        methodToRun = redisInstances[servers[0]][command];
    } else if(command.customMethod && command.customMethod instanceof Function) {
        methodToRun = command.customMethod;
    } else if(command.customMethod && typeof(command.customMethod) === 'string') {
        methodToRun = redisInstances[servers[0]][command.customMethod];
    } else {
        throw new Error(command + ' is not a valid command!');
    }
    async.parallel(servers.reduce(function(parObj, server) {
        parObj[server] = function(next) {
            var myArgs = args.slice(0);
            myArgs.push(next);
            methodToRun.apply(redisInstances[server], myArgs);
        };
        return parObj;
    }, {}), callback);
}

// Get a set of redis client instances and return the ``sendCommand`` method to interact with them
module.exports = function getInstances(instances, methods) {
    redisInstances = instances;
    customMethods = methods;
    return sendCommand;
};