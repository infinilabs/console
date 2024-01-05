package main

import (
	"context"
	"errors"
	_ "expvar"
	api3 "infini.sh/console/modules/agent/api"
	"infini.sh/console/plugin/api/email"
	model2 "infini.sh/framework/core/model"
	_ "time/tzdata"

	log "github.com/cihub/seelog"
	"infini.sh/console/config"
	"infini.sh/console/model"
	"infini.sh/console/model/alerting"
	"infini.sh/console/model/insight"
	_ "infini.sh/console/plugin"
	setup1 "infini.sh/console/plugin/setup"
	alerting2 "infini.sh/console/service/alerting"
	"infini.sh/framework"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	_ "infini.sh/framework/core/log"
	"infini.sh/framework/core/module"
	"infini.sh/framework/core/orm"
	task1 "infini.sh/framework/core/task"
	_ "infini.sh/framework/modules/api"
	elastic2 "infini.sh/framework/modules/elastic"
	"infini.sh/framework/modules/metrics"
	"infini.sh/framework/modules/pipeline"
	queue2 "infini.sh/framework/modules/queue/disk_queue"
	"infini.sh/framework/modules/redis"
	"infini.sh/framework/modules/security"
	"infini.sh/framework/modules/stats"
	"infini.sh/framework/modules/task"
	"infini.sh/framework/modules/ui"
	_ "infini.sh/framework/plugins"
	_ "infini.sh/framework/plugins/managed"
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


	modules := []module.ModuleItem{}
	modules = append(modules, module.ModuleItem{Value: &stats.SimpleStatsModule{}, Priority: 1})
	modules = append(modules, module.ModuleItem{Value: &elastic2.ElasticModule{}, Priority: 1})
	modules = append(modules, module.ModuleItem{Value: &queue2.DiskQueue{}, Priority: 1})
	modules = append(modules, module.ModuleItem{Value: &redis.RedisModule{}, Priority: 1})
	modules = append(modules, module.ModuleItem{Value: &pipeline.PipeModule{}, Priority: 1})
	modules = append(modules, module.ModuleItem{Value: &task.TaskModule{}, Priority: 1})
	modules = append(modules, module.ModuleItem{Value: &metrics.MetricsModule{}, Priority: 1})
	modules = append(modules, module.ModuleItem{Value: &security.Module{}, Priority: 1})

	uiModule := &ui.UIModule{}

	global.Env().EnableSetup(true)

	if app.Setup(func() {

		//load core modules first
		module.RegisterSystemModule(&setup1.Module{})
		module.RegisterSystemModule(uiModule)

		if !global.Env().SetupRequired() {
			for _, v := range modules {
				module.RegisterModuleWithPriority(v.Value, v.Priority)
			}
		} else {
			for _, v := range modules {
				v.Value.Setup()
			}
		}


		api3.Init()

		appConfig = &config.AppConfig{
			UI: config.UIConfig{
				LocalPath:    ".public",
				VFSEnabled:   true,
				LocalEnabled: true,
			},
		}

		ok, err := env.ParseConfig("web", appConfig)
		if err != nil && global.Env().SystemConfig.Configs.PanicOnConfigError {
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

		var initFunc = func() {

			elastic2.InitTemplate(false)

			//orm.RegisterSchema(model.Dict{}, "dict")
			orm.RegisterSchemaWithIndexName(elastic.View{}, "view")
			orm.RegisterSchemaWithIndexName(elastic.CommonCommand{}, "commands")
			//orm.RegisterSchema(elastic.TraceTemplate{}, "trace-template")
			orm.RegisterSchemaWithIndexName(alerting.Rule{}, "alert-rule")
			orm.RegisterSchemaWithIndexName(alerting.Alert{}, "alert-history")
			orm.RegisterSchemaWithIndexName(alerting.AlertMessage{}, "alert-message")
			orm.RegisterSchemaWithIndexName(alerting.Channel{}, "channel")
			orm.RegisterSchemaWithIndexName(insight.Visualization{}, "visualization")
			orm.RegisterSchemaWithIndexName(insight.Dashboard{}, "dashboard")
			orm.RegisterSchemaWithIndexName(insight.Widget{}, "widget")
			orm.RegisterSchemaWithIndexName(task1.Task{}, "task")
			orm.RegisterSchemaWithIndexName(model.Layout{}, "layout")
			orm.RegisterSchemaWithIndexName(model.Notification{}, "notification")
			orm.RegisterSchemaWithIndexName(model.EmailServer{}, "email-server")
			orm.RegisterSchemaWithIndexName(model2.Instance{}, "instance")
			orm.RegisterSchemaWithIndexName(api3.RemoteConfig{}, "configs")


			if global.Env().SetupRequired() {
				for _, v := range modules {
					v.Value.Start()
				}
			}

			task1.RunWithinGroup("initialize_alerting", func(ctx context.Context) error {
				err := alerting2.InitTasks()
				if err != nil {
					log.Errorf("init alerting task error: %v", err)
				}
				return err
			})
			task1.RunWithinGroup("initialize_email_server", func(ctx context.Context) error {
				err := email.InitEmailServer()
				if err != nil {
					log.Errorf("init email server error: %v", err)
				}
				return err
			})
		}

		if !global.Env().SetupRequired() {
			initFunc()
		} else {
			setup1.RegisterSetupCallback(initFunc)
		}

		if !global.Env().SetupRequired() {
			err := bootstrapRequirementCheck()
			if err != nil {
				panic(err)
			}
		}

	}, nil) {
		app.Run()
	}

}
