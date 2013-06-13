var redisInstance;

function sendCommand(command, args, callback) {
    if(!redisInstance[command]) return callback(new Error(command + ' command does not exist'));

    args = args || [];
    args.push(callback);
    redisInstance[command].apply(redisInstance, args);
}

module.exports = function getInstance(instance) {
    redisInstance = instance;
    return sendCommand;
};