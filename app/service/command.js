const Service = require('egg').Service;
var nssh = require('node-ssh');

class CommandService extends Service{
    async exec(params){
        let {host, user, password, port, cmd} = params;
        port = port || 22;
        var ssh = new nssh();
        return ssh.connect({
          host: host,
          port: port, 
          username: user,
          password: password
        }).then(function(){
            return ssh.execCommand(cmd, {}).then(function(result) {
                ssh.dispose();
                if(result.stderr != ""){
                    return result.stderr;
                }
                return result.stdout;
            }); 
        });
    }
}
module.exports = CommandService;
