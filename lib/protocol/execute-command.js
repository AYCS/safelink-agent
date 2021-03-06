/**
 *
 * Copyright 2013 Joel Grenon
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Q = require('q'),
    redis = require('redis'),
    _ = require('lodash'),
    shortid = require('shortid'),
    moment = require('moment');

module.exports = function(request) {
    var _this = this;
    this.log.trace(request, "Handling execute-command command");
    var timeout = _this.timeout || 30;

    if(request.options)
        timeout = request.options.timeout || _this.timeout;

    var defer = Q.defer().timeout(timeout * 1000);

    Q.nextTick(function() {
        var id = request.uuid || shortid.generate();
        var cmd = _.extend(request, {$id:id});

        // Record the actual timeout for this command as it might be different for each command
        cmd.timeout = timeout;

        // First try built-in commands
        var commandHandler = _this.commandHandlers[request.commandKey];
        if(commandHandler) {
            commandHandler.call(_this, cmd).then(function(result){
                defer.resolve(result);
            }, function(err) {
                defer.reject(err);
            });
        }
        else {
            _this.once('command-result-'+id, function(result) {
                defer.resolve(result);
            });
            // First try a direct handler
            _this.emit('execute-'+cmd.commandKey, cmd);
            // Trigger the generic handler
            _this.emit('execute-command', cmd);
        }

    });

    return defer.promise;
};
