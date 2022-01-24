package main

import (
	"errors"
	_ "expvar"
	"infini.sh/framework"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/module"
	"infini.sh/framework/core/orm"
	pipe "infini.sh/framework/core/pipeline"
	queue2 "infini.sh/framework/modules/disk_queue"
	elastic2 "infini.sh/framework/modules/elastic"
	"infini.sh/framework/modules/filter"
	"infini.sh/framework/modules/metrics"
	"infini.sh/framework/modules/pipeline"
	"infini.sh/framework/modules/redis"
	"infini.sh/framework/modules/stats"
	"infini.sh/framework/modules/task"
	"infini.sh/framework/modules/ui"
	"infini.sh/framework/plugins/elastic/json_indexing"
	api2 "infini.sh/gateway/api"
	_ "infini.sh/gateway/proxy"
	"infini.sh/search-center/config"
	"infini.sh/search-center/model"
	"infini.sh/search-center/model/alerting"
	alertSrv "infini.sh/search-center/service/alerting"
)

var appConfig *config.AppConfig
var appUI *UI

func main() {
	terminalHeader := ("   ___                      _\n")
	terminalHeader += ("  / __\\___  _ __  ___  ___ | | ___\n")
	terminalHeader += (" / /  / _ \\| '_ \\/ __|/ _ \\| |/ _ \\\n")
	terminalHeader += ("/ /__| (_) | | | \\__ \\ (_) | |  __/\n")
	terminalHeader += ("\\____/\\___/|_| |_|___/\\___/|_|\\___|\n\n")

	terminalFooter := ""

	app := framework.NewApp("console", "the easiest way to operate your own elasticsearch platform.",
		config.Version, config.LastCommitLog, config.BuildDate, config.EOLDate, terminalHeader, terminalFooter)

	app.Init(nil)
	defer app.Shutdown()

	api := api2.GatewayAPI{}

	if app.Setup(func() {

		//load core modules first
		module.RegisterSystemModule(elastic2.ElasticModule{})
		module.RegisterSystemModule(&filter.FilterModule{})
		module.RegisterSystemModule(&stats.SimpleStatsModule{})
		module.RegisterSystemModule(&queue2.DiskQueue{})
		module.RegisterSystemModule(&redis.RedisModule{})
		module.RegisterSystemModule(&ui.UIModule{})
		module.RegisterSystemModule(&pipeline.PipeModule{})
		module.RegisterSystemModule(&task.TaskModule{})

		pipe.RegisterProcessorPlugin("json_indexing", json_indexing.New)
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

		//uiConfig := ui.UIConfig{}
		//env.ParseConfig("web", &uiConfig)
		//
		//if len(global.Env().SystemConfig.APIConfig.CrossDomain.AllowedOrigins)==0{
		//	global.Env().SystemConfig.APIConfig.CrossDomain.AllowedOrigins=
		//		append(global.Env().SystemConfig.APIConfig.CrossDomain.AllowedOrigins,uiConfig.NetworkConfig.GetBindingAddr())
		//}
		//apiConfig := global.Env().SystemConfig.APIConfig
		//if len(apiConfig.CrossDomain.AllowedOrigins) == 0 {
		//	apiConfig.CrossDomain.AllowedOrigins = []string{
		//		fmt.Sprintf("%s://%s", appConfig.GetSchema(), appConfig.Network.GetPublishAddr()),
		//	}
		//}

		//start each module, with enabled provider

	}, func() {

		module.Start()

		orm.RegisterSchemaWithIndexName(model.Dict{}, "dict")
		orm.RegisterSchemaWithIndexName(model.Reindex{}, "reindex")
		orm.RegisterSchemaWithIndexName(elastic.View{}, "view")
		orm.RegisterSchemaWithIndexName(alerting.Config{}, "alerting-config")
		orm.RegisterSchemaWithIndexName(alerting.Alert{}, "alerting-alerts")
		orm.RegisterSchemaWithIndexName(alerting.AlertingHistory{}, "alerting-history")
		orm.RegisterSchemaWithIndexName(elastic.CommonCommand{}, "commands")
		orm.RegisterSchemaWithIndexName(elastic.TraceTemplate{}, "trace-template")

		api.RegisterSchema()

		alertSrv.GetScheduler().Start()

	}, nil) {
		app.Run()
	}

}
