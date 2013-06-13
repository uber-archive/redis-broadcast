# redis-broadcast

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
}, { useChildProcesses: false });

// Write to only one server
var writePrimary = myRedisServers.writeTo('primary');
writePrimary.set('foo', 'bar', callback);

// Write to all servers
var writeAll = myRedisServers.writeTo('all');
writeAll.set('true', false, callback);
// Callback gets object of [err, result] arrays, keys matching server names

// Write to a pair of servers in parallel
var writePrimarySecondary = myRedisServers.writeTo(['primary', 'secondary']);
writePrimarySecondary.set('fubar', true, callback);
// Gets object of [err, result] arrays, keys matching server names

// Write to three servers in series, stopping if any returns an error
var write123 = myRedisServers.writeTo('primary').thenTo('secondary').thenTo('tertiary');
write123.set('hello', 'world', callback);
// Gets array of [err, result] arrays, order matching write order

// Write to primary, then all remaining servers in parallel if no error
var writePrimaryThenRemaining = myRedisServers.writeTo('primary').thenTo('remaining');
writePrimaryThenRemaining.set('distributedOnlyIfSuccessful', true, callback);
// Gets an array; first value is an [err, result] array,
// second is an object of [err, result] arrays, keys matching server names
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
