'use strict';

let redisSendCommand;
const blacklist = ['info'];

module.exports = function(redis) {
  redisSendCommand = redisSendCommand || redis.RedisClient.prototype.internal_send_command;

  return {
    name: 'redis',
    handler: function(req, res, next) {

      redis.RedisClient.prototype.internal_send_command = !req.miniprofiler || !req.miniprofiler.enabled ? redisSendCommand : function(cmd) {
        if (this.ready && blacklist.indexOf(cmd.command) == -1) {
          const callback = cmd.callback;
          if (callback && req && req.miniprofiler) {
            const query = `${cmd.command} ${cmd.args.join(', ')}`.trim();
            const timing = req.miniprofiler.startTimeQuery('redis', query);
            const miniprofiler = req.miniprofiler;

            cmd.callback = function() {
              miniprofiler.stopTimeQuery(timing);
              callback.apply(this, arguments);
            };
          }
        }
        redisSendCommand.call(this, cmd);
      };

      next();
    }
  };
};
