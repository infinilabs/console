package main

import (
	"context"
	"errors"
	_ "expvar"
	log "github.com/cihub/seelog"
	"infini.sh/console/config"
	"infini.sh/console/model/alerting"
	"infini.sh/console/model/gateway"
	_ "infini.sh/console/plugin"
	alerting2 "infini.sh/console/service/alerting"
	"infini.sh/framework"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/insight"
	_ "infini.sh/framework/core/log"
	"infini.sh/framework/core/module"
	"infini.sh/framework/core/orm"
	task1 "infini.sh/framework/core/task"
	"infini.sh/framework/modules/agent"
	_ "infini.sh/framework/modules/api"
	elastic2 "infini.sh/framework/modules/elastic"
	"infini.sh/framework/modules/metrics"
	"infini.sh/framework/modules/migration"
	"infini.sh/framework/modules/pipeline"
	queue2 "infini.sh/framework/modules/queue/disk_queue"
	"infini.sh/framework/modules/redis"
	"infini.sh/framework/modules/security"
	"infini.sh/framework/modules/stats"
	"infini.sh/framework/modules/task"
	"infini.sh/framework/modules/ui"
	_ "infini.sh/framework/plugins"
	setup1 "infini.sh/console/plugin/setup"
	_ "infini.sh/console/plugin"
	api2 "infini.sh/gateway/api"
	_ "infini.sh/gateway/proxy"
	_ "time/tzdata"
)

var appConfig *config.AppConfig
var appUI *UI

func main() {
	terminalHeader := ("\n")
	terminalHeader += ("   ___  ___    __  __    ___  __   __ \n")
	terminalHeader += ("  / __\\/___\\/\\ \\ \\/ _\\  /___\\/ /  /__\\\n")
	terminalHeader += (" / /  //  //  \\/ /\\ \\  //  // /  /_\\  \n")
	terminalHeader += ("/ /__/ \\_// /\\  / _\\ \\/ \\_// /__//__  \n")
	terminalHeader += ("\\____|___/\\_\\ \\/  \\__/\\___/\\____|__/  \n")
	terminalHeader += ("                                      \n\n")

	terminalFooter := ""

	app := framework.NewApp("console", "The easiest way to operate your own search platform.",
		config.Version, config.BuildNumber, config.LastCommitLog, config.BuildDate, config.EOLDate, terminalHeader, terminalFooter)

	app.Init(nil)
	defer app.Shutdown()

	api := api2.GatewayAPI{}

	modules:=[]module.Module{}
	modules=append(modules,&stats.SimpleStatsModule{})
	modules=append(modules,&elastic2.ElasticModule{})
	modules=append(modules,&queue2.DiskQueue{})
	modules=append(modules,&redis.RedisModule{})
	modules=append(modules,&pipeline.PipeModule{})
	modules=append(modules,&task.TaskModule{})
	modules=append(modules,&agent.AgentModule{})
	modules=append(modules,&metrics.MetricsModule{})
	modules=append(modules,&security.Module{})
	modules=append(modules,&migration.MigrationModule{})

	uiModule:=&ui.UIModule{}

	if app.Setup(func() {

		//load core modules first
		module.RegisterSystemModule(&setup1.Module{})
		module.RegisterSystemModule(uiModule)

		var initFunc= func() {
			module.RegisterSystemModule(&stats.SimpleStatsModule{})
			module.RegisterSystemModule(&elastic2.ElasticModule{})
			module.RegisterSystemModule(&queue2.DiskQueue{})
			module.RegisterSystemModule(&redis.RedisModule{})
			module.RegisterSystemModule(&pipeline.PipeModule{})
			module.RegisterSystemModule(&task.TaskModule{})
			module.RegisterSystemModule(&agent.AgentModule{})
			module.RegisterSystemModule(&metrics.MetricsModule{})
			module.RegisterSystemModule(&security.Module{})
			module.RegisterSystemModule(&migration.MigrationModule{})
		}

		if !global.Env().SetupRequired(){
			initFunc()
		}else{
			for _, v := range modules {
				v.Setup()
			}
			setup1.RegisterSetupCallback(initFunc)
		}

		api.RegisterAPI("")

		appConfig = &config.AppConfig{
			UI: config.UIConfig{
				LocalPath:    ".public",
				VFSEnabled:   true,
				LocalEnabled: true,
			},
		}

		ok, err := env.ParseConfig("web", appConfig)
		if err != nil {
			panic(err)
		}
		if !ok {
			panic(errors.New("config not exists"))
		}

		//load web UI files
		appUI = &UI{Config: appConfig}
		appUI.InitUI()

	}, func() {

		module.Start()

		var initFunc= func() {
			if global.Env().SetupRequired() {
				for _, v := range modules {
					v.Start()
				}
			}

			elastic2.InitTemplate(false)

			//orm.RegisterSchemaWithIndexName(model.Dict{}, "dict")
			orm.RegisterSchemaWithIndexName(elastic.View{}, "view")
			orm.RegisterSchemaWithIndexName(elastic.CommonCommand{}, "commands")
			//orm.RegisterSchemaWithIndexName(elastic.TraceTemplate{}, "trace-template")
			orm.RegisterSchemaWithIndexName(gateway.Instance{}, "gateway-instance")
			orm.RegisterSchemaWithIndexName(alerting.Rule{}, "alert-rule")
			orm.RegisterSchemaWithIndexName(alerting.Alert{}, "alert-history")
			orm.RegisterSchemaWithIndexName(alerting.AlertMessage{}, "alert-message")
			orm.RegisterSchemaWithIndexName(alerting.Channel{}, "channel")
			orm.RegisterSchemaWithIndexName(insight.Visualization{}, "visualization")
			orm.RegisterSchemaWithIndexName(insight.Dashboard{}, "dashboard")
			orm.RegisterSchemaWithIndexName(task1.Task{}, "task")
			orm.RegisterSchemaWithIndexName(task1.Log{}, "task-log")
			api.RegisterSchema()

			task1.RunWithinGroup("initialize_alerting",func(ctx context.Context) error {
				err := alerting2.InitTasks()
				if err != nil {
					log.Errorf("init alerting task error: %v", err)
				}
				return err
			})
		}

		if !global.Env().SetupRequired(){
			initFunc()
		}else{
			setup1.RegisterSetupCallback(initFunc)
		}

		if !global.Env().SetupRequired(){
			err := bootstrapRequirementCheck()
			if err != nil {
				panic(err)
			}
		}

	}, nil) {
		app.Run()
	}

}
