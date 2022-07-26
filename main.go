package main

import (
	"errors"
	_ "expvar"
	"infini.sh/console/config"
	"infini.sh/console/model/alerting"
	"infini.sh/console/model/gateway"
	_ "infini.sh/console/plugin"
	alerting2 "infini.sh/console/service/alerting"
	"infini.sh/framework"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/insight"
	_ "infini.sh/framework/core/log"
	"infini.sh/framework/core/module"
	"infini.sh/framework/core/orm"
	_ "infini.sh/framework/modules/api"
	elastic2 "infini.sh/framework/modules/elastic"
	"infini.sh/framework/modules/filter"
	"infini.sh/framework/modules/metrics"
	"infini.sh/framework/modules/pipeline"
	queue2 "infini.sh/framework/modules/queue/disk_queue"
	"infini.sh/framework/modules/redis"
	"infini.sh/framework/modules/stats"
	"infini.sh/framework/modules/task"
	"infini.sh/framework/modules/ui"
	_ "infini.sh/framework/plugins"
	api2 "infini.sh/gateway/api"
	_ "infini.sh/gateway/proxy"
	log "src/github.com/cihub/seelog"
)

var appConfig *config.AppConfig
var appUI *UI

func main() {
	terminalHeader := ("\n\n")
	terminalHeader += ("   ___  __   ___         ___          \n")
	terminalHeader += ("  / __\\/ /  /___\\/\\ /\\  /   \\         \n")
	terminalHeader += (" / /  / /  //  // / \\ \\/ /\\ /         \n")
	terminalHeader += ("/ /__/ /__/ \\_//\\ \\_/ / /_//          \n")
	terminalHeader += ("\\____|____|___/  \\___/___,'           \n")
	terminalHeader += ("   ___  ___    __  __    ___  __   __ \n")
	terminalHeader += ("  / __\\/___\\/\\ \\ \\/ _\\  /___\\/ /  /__\\\n")
	terminalHeader += (" / /  //  //  \\/ /\\ \\  //  // /  /_\\  \n")
	terminalHeader += ("/ /__/ \\_// /\\  / _\\ \\/ \\_// /__//__  \n")
	terminalHeader += ("\\____|___/\\_\\ \\/  \\__/\\___/\\____|__/  \n")
	terminalHeader += ("                                      \n\n")

	terminalFooter := ""

	app := framework.NewApp("console", "INFINI Cloud Console, The easiest way to operate your own elasticsearch platform.",
		config.Version, config.BuildNumber, config.LastCommitLog, config.BuildDate, config.EOLDate, terminalHeader, terminalFooter)

	app.Init(nil)
	defer app.Shutdown()

	api := api2.GatewayAPI{}

	if app.Setup(func() {
		err := bootstrapRequirementCheck()
		if err != nil {
			panic(err)
		}

		//load core modules first
		module.RegisterSystemModule(&filter.FilterModule{})
		module.RegisterSystemModule(&elastic2.ElasticModule{})
		module.RegisterSystemModule(&stats.SimpleStatsModule{})
		module.RegisterSystemModule(&queue2.DiskQueue{})
		module.RegisterSystemModule(&redis.RedisModule{})
		module.RegisterSystemModule(&ui.UIModule{})
		module.RegisterSystemModule(&pipeline.PipeModule{})
		module.RegisterSystemModule(&task.TaskModule{})

		module.RegisterUserPlugin(&metrics.MetricsModule{})

		api.RegisterAPI("")

		appConfig = &config.AppConfig{
			Elasticsearch: "default",
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

		//orm.RegisterSchemaWithIndexName(model.Dict{}, "dict")
		//orm.RegisterSchemaWithIndexName(model.Reindex{}, "reindex")
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
		api.RegisterSchema()

		go func() {
			err := alerting2.InitTasks()
			if err != nil {
				log.Errorf("init alerting task error: %v", err)
			}
		}()

	}, nil) {
		app.Run()
	}

}
