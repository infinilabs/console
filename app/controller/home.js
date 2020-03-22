'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    if(this.app.config.env == "local") {
        //TODO remove hardcode
        this.app.config.assets.url = `http://localhost:10000`;
    }
    await this.ctx.render('index.html');
  }

  async proxy() {
    const ctx = this.ctx;
    // use roadhog mock api first
    const url = this.app.config.assets.url + ctx.path + '?' + ctx.querystring;

    const res = await this.ctx.curl(url, {
      method: this.ctx.method,
    });
    ctx.body = res.data;
    ctx.status = res.status;
  }
}

module.exports = HomeController;
