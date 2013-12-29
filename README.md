# redis-broadcast

[![NPM version](https://badge.fury.io/js/redis-broadcast.png)](http://badge.fury.io/js/redis-broadcast) [![Dependency Status](https://gemnasium.com/uber/redis-broadcast.png)](https://gemnasium.com/uber/redis-broadcast) [![Build Status](https://travis-ci.org/uber/redis-broadcast.png?branch=master)](https://travis-ci.org/uber/redis-broadcast) [![Coverage Status](https://coveralls.io/repos/uber/redis-broadcast/badge.png?branch=master)](https://coveralls.io/r/uber/redis-broadcast?branch=master)

Write redis commands to a set of redises efficiently

## Install

    npm install redis-broadcast

## Usage

```js
var RedisBroadcast = require('redis-broadcast');

// Define the redis servers, and whether or not
// they should be written to via child processes
var myRedisServers = new RedisBroadcast({
    primary: [6379, 'localhost'],
    secondary: [6379, 'some.other.server'],
    tertiary: [6379, 'and.another.server'],
    quaternary: [6379, 'and.another']
}, {
    useChildProcesses: false,
    customMethods: {
        setnxOnce: [
            function setnxOnce(key, val, callback) {
                this.setnx(key, val, function(err, result) {
                    if(err || !result) {
                        callback(err || new Error('key already defined'));
                    } else {
                        callback(null, result);
                    }
                });
            },
            'set'
        ]
    }
});

// Write to only one server
var writePrimary = myRedisServers.writeTo('primary');
writePrimary.set('foo', 'bar', callback);
// Callback gets error and result arrays. The array position indicates which group the request belongs to,
// in this case there is only one group. Each array value is an object whose keys are the names of the servers
// and whose values are the redis responses. If there were no errors, the error array is omitted.
// undefined, [{ primary: 'OK' }]

// Write to all servers in parallel
var writeAll = myRedisServers.writeTo('all');
writeAll.set('true', false, callback);
// Callback gets error and result arrays of objects, keys matching server names
// [{
//     primary: 'OK',
//     secondary: 'OK',
//     tertiary: 'OK',
//     quaternary: 'OK'
// }]

// Write to a pair of servers in parallel
var writePrimarySecondary = myRedisServers.writeTo(['primary', 'secondary']);
writePrimarySecondary.set('fubar', true, callback);
// Gets error and result arrays of objects, keys matching server names
// [{
//     primary: 'OK',
//     secondary: 'OK'
// }]

// Write to three servers in series, stopping if any returns an error
var write123 = myRedisServers.writeTo('primary').thenTo('secondary').thenTo('tertiary');
write123.set('hello', 'world', callback);
// Gets error and result arrays of objects, keys matching server names, order of objects matching write order
// [
//     { primary: 'OK' },
//     { secondary: 'OK' },
//     { tertiary: 'OK' }
// ]

// Write to primary, then all remaining servers in parallel if no error
var writePrimaryThenRemaining = myRedisServers.writeTo('primary').thenTo('remaining');
writePrimaryThenRemaining.set('distributedOnlyIfSuccessful', true, callback);
// Gets error and result arrays of objects; first value is an object,
// second is an object, keys matching server names
// [
//     { primary: 'OK' },
//     {
//         secondary: 'OK',
//         tertiary: 'OK',
//         quaternary: 'OK'
//     }
// ]

// Write to primary, then all remaining servers in parallel if key doesn't already exist.
// NOTE: Custom functions must be 'pure' (not closures) to work on the child process.
var writePrimaryThenRemainingIfNew = myRedisServers.writeTo('primary').thenTo('remaining');
writePrimaryThenRemainingIfNew.setnxOnce('newkey', true, callback);
// Gets error and result arrays of objects, the first array element gets the results of setnx, the second gets the results of set, if called
// [
//     { primary: 1 },
//     {
//         secondary: 'OK',
//         tertiary: 'OK',
//         quaternary: 'OK
//     }
// ]
```

## License (MIT)

Copyright (C) 2013 by Uber Technologies, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
