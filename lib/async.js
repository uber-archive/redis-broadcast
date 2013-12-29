// The regular async library didn't quite cut it. Error handling is poor
// (no idea which call failed in an async.parallel call) so replaced it
// with my own implementations here. Because this is just what I need,
// the series function takes an array and the parallel function takes an
// object. Also, the series function we want to abort on failure, while
// we don't want that with the parallel function. TODO: Get a PR up for
// coalan/async to make its series and parallel functions smarter.

module.exports.series = function series(seriesArray, callback) {
    var errorArray = [];
    var resultArray = [];
    var location = 0;
    function next(error, result, initial) {
        // Kick off the whole show
        if (!error && !result && initial === true) {
            return seriesArray[0](next);
        }

        if (result) resultArray[location] = result;
        location++;

        if (error) {
            errorArray[--location] = error;
            return callback(errorArray, resultArray);
        } else if (location === seriesArray.length) {
            return callback(undefined, resultArray);
        } else {
            seriesArray[location](next);
        }
    }
    next(undefined, undefined, true);
};

function objHasTruthyVals(obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        if (!!obj[keys[i]]) return true;
    }
    return false;
}

module.exports.parallel = function parallel(parallelObj, callback) {
    var errorObj = {};
    var resultObj = {};
    var methods = Object.keys(parallelObj);
    var responses = 0;
    function next(method, error, result) {
        responses++;
        errorObj[method] = error;
        resultObj[method] = result;
        if (responses === methods.length) {
            var hasErrors = objHasTruthyVals(errorObj);
            return callback(hasErrors ? errorObj : undefined, resultObj);
        }
    }
    for (var i = 0; i < methods.length; i++) {
        parallelObj[methods[i]](next.bind(this, methods[i]));
    }
};