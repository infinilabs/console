/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"fmt"
	"infini.sh/console/model"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"os"
	"path"
)

func StartEmailServer(serv *model.EmailServer) error {
	pipeCfgStr := GeneratePipelineConfig(serv)
	//cfg, err := yaml.NewConfig([]byte(pipeCfgStr))
	//if err != nil {
	//	return fmt.Errorf("new config error: %w", err)
	//}
	cfgDir := global.Env().GetConfigDir()
	sendEmailCfgFile := path.Join(cfgDir, "send_email.yml")
	_, err := util.FilePutContent(sendEmailCfgFile, pipeCfgStr)
	return err
	//pipeCfg := pipeline.PipelineConfigV2{}
	//err = cfg.Unpack(&pipeCfg)
	//if err != nil {
	//	return fmt.Errorf("unpack pipeline config error: %w", err)
	//}
	//v := global.Lookup("pipeline_module")
	//var (
	//	pipeM *pipeline2.PipeModule
	//	ok bool
	//)
	//if pipeM, ok = v.(*pipeline2.PipeModule); !ok {
	//	return fmt.Errorf("can not find pipeline module")
	//}
	//err = pipeM.CreatePipeline(pipeCfg, true)
	//if err != nil {
	//	return fmt.Errorf("create email server pipeline error: %w", err)
	//}
	return nil
}

func StopEmailServer(serv *model.EmailServer) error {
	cfgDir := global.Env().GetConfigDir()
	sendEmailCfgFile := path.Join(cfgDir, "send_email.yml")
	return os.RemoveAll(sendEmailCfgFile)
}

func getEmailServerTaskID(serv *model.EmailServer) string {
	return fmt.Sprintf("send_email_%s", serv.ID)
}

func GeneratePipelineConfig(serv *model.EmailServer) string {
	pipelineTpl := `name: %s
auto_start: true
keep_running: true
retry_delay_in_ms: 5000
processor:
  - consumer:
      consumer:
        fetch_max_messages: 1
      max_worker_size: 200
      num_of_slices: 1
      idle_timeout_in_seconds: 30
      queue_selector:
        keys:
          - %s
      processor:
        - smtp:
            idle_timeout_in_seconds: 1
            server:
              host: "%s"
              port: %d
              tls: %v
            auth:
              username: "%s"
              password: "%s"
            recipients:
              cc: []
            templates:
              raw:
                content_type: "text/plain"
                subject: "$[[subject]]"
                body: "$[[body]]"`
	pipelineCfg := fmt.Sprintf(pipelineTpl, getEmailServerTaskID(serv), serv.ID, serv.Host, serv.Port, serv.TLS, serv.Auth.Username, serv.Auth.Password)
	return  pipelineCfg
}
