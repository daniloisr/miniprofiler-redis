'use strict';

let redisSendCommand;
const blacklist = ['info'];

module.exports = function(redis) {
  redisSendCommand = redisSendCommand || redis.RedisClient.prototype.internal_send_command;

  return {
    name: 'redis',
    handler: function(asyncContext, next) {
      redis.RedisClient.prototype.internal_send_command = !asyncContext.get() || !asyncContext.get().enabled ? redisSendCommand : function(cmd) {
        if (this.ready && blacklist.indexOf(cmd.command) == -1) {
          const callback = cmd.callback;
          if (callback && asyncContext.get()) {
            const query = `${cmd.command} ${cmd.args.join(', ')}`.trim();
            const timing = asyncContext.get().startTimeQuery('redis', query);
            const miniprofiler = asyncContext.get();

            cmd.callback = function() {
              miniprofiler.stopTimeQuery(timing);
              asyncContext.set(miniprofiler);
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
