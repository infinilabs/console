package main

import (
	"errors"
	_ "expvar"
	"fmt"
	"infini.sh/framework"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/module"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/modules"
	"infini.sh/framework/modules/metrics"
	"infini.sh/search-center/config"
	"infini.sh/search-center/model"
	"infini.sh/search-center/model/alerting"
	alertSrv "infini.sh/search-center/service/alerting"
)

var appConfig *config.AppConfig
var appUI *UI

func main() {

	terminalHeader := ("                                       .__     \n")
	terminalHeader += ("  ______  ____  _____  _______   ____  |  |__  \n")
	terminalHeader += (" /  ___/_/ __ \\ \\__  \\ \\_  __ \\_/ ___\\ |  |  \\ \n")
	terminalHeader += (" \\___ \\ \\  ___/  / __ \\_|  | \\/\\  \\___ |   Y  \\ \n")
	terminalHeader += ("/____  > \\___  >(____  /___|    \\___  >|___|  /\n")
	terminalHeader += ("  ____/  ____\\/  ____\\_/  |_   ____ _______ \\/ \n")
	terminalHeader += ("_/ ___\\_/ __ \\  /    \\\\   __\\_/ __ \\\\_  __ \\   \n")
	terminalHeader += ("\\  \\___\\  ___/ |   |  \\|  |  \\  ___/ |  | \\/   \n")
	terminalHeader += (" \\___  >\\___  >|___|  /|__|   \\___  >|__|      \n")
	terminalHeader += ("     \\/     \\/      \\/            \\/           \n\n")

	terminalFooter := ""

	app := framework.NewApp("search-center", "the easiest way to operate your own search center.",
		config.Version, config.LastCommitLog, config.BuildDate,config.EOLDate, terminalHeader, terminalFooter)

	app.Init(nil)
	defer app.Shutdown()

	app.Setup(func() {

		//load core modules first
		modules.Register()
		module.RegisterUserPlugin(&metrics.MetricsModule{})

		appConfig = &config.AppConfig{
			Elasticsearch:  "default",
			UI: config.UIConfig{
				LocalPath:   ".public",
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
		apiConfig := global.Env().SystemConfig.APIConfig
		if len(apiConfig.CrossDomain.AllowedOrigins) == 0 {
			apiConfig.CrossDomain.AllowedOrigins = []string{
				fmt.Sprintf("%s://%s", appConfig.GetSchema(), apiConfig.NetworkConfig.GetPublishAddr()),
			}
		}

		//start each module, with enabled provider
		module.Start()

	}, func() {
		orm.RegisterSchemaWithIndexName(model.Dict{}, "dict")
		orm.RegisterSchemaWithIndexName(model.Reindex{}, "reindex")
		orm.RegisterSchemaWithIndexName(elastic.View{}, "view")
		orm.RegisterSchemaWithIndexName(alerting.Config{}, "alerting-config")
		orm.RegisterSchemaWithIndexName(alerting.Alert{}, "alerting-alerts")
		orm.RegisterSchemaWithIndexName(alerting.AlertingHistory{}, "alerting-alert-history")
		alertSrv.GetScheduler().Start()
	},nil)

	app.Run()

}
