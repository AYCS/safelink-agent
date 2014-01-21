var Agent = require('../../..').Agent;

module.exports.launch = function(opts) {
    opts= opts || {};
    console.log("Launching the executer agent");

    var agent = new Agent({
        id: "long-process-executer",
        endpoint: "http://localhost:9090",
        logLevel: 'info'
    });

    var task;
    var progress = 5;
    var taskDeferred;

    agent.registerCommandHandler('start-long-task',function(cmd, deferred) {
        taskDeferred = deferred;
        console.log("Executing a long-task");
        progress = 5;
        task = setInterval(function() {
            progress += 5;
            if(progress >= 100) {
                deferred.resolve({progress:progress, success: true});
            }
            else
                deferred.notify({value: progress, msg: 'Long task is progressing: '+progress});
        }, 10000);
    });

    agent.registerCommandHandler('stop-long-task', function(cmd, deferred) {
        if(task) {
            clearInterval(task);
            task = undefined;
            deferred.resolve({success:true});
            if(taskDeferred) {
                taskDeferred.resolve({success:true, result: 'stopped'});
                delete taskDeferred;
                progress = 0;
            }
        }
        else
            deferred.reject({success: false, error:'no-active-task'});
    });

    return agent.start().then(function() {
        console.log("Executer agent is now started");
    });
};
