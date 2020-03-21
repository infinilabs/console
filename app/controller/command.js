const Controller = require('egg').Controller;

class CommandController extends Controller{
    async exec() {
        const { ctx, service } = this;
        const params = {
              user: { type: 'string' },
              password: { type: 'string' },
              host:{ type:'string' },
              cmd: {type: 'string'},
        };
        console.log(ctx.request.body);
        ctx.validate(params, ctx.request.body);
        const res = await service.command.exec(ctx.request.body);
        ctx.body = {data: res};
    }
}

module.exports = CommandController;
