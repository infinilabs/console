package main

import (
	"errors"
	_ "expvar"
	"infini.sh/framework"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/module"
	"infini.sh/framework/modules"
	"infini.sh/logging-center/config"
)

var appConfig *config.AppConfig
var appUI *UI

func main() {

	terminalHeader := ("   __ _  __ ____ __ _  __ __       \n")
	terminalHeader += ("  / // |/ // __// // |/ // /       \n")
	terminalHeader += (" / // || // _/ / // || // /        \n")
	terminalHeader += ("/_//_/|_//_/  /_//_/|_//_/         \n")
	terminalHeader += ("   __   _    __   __   __ _  __  __\n")
	terminalHeader += ("  / / ,' \\ ,'_/ ,'_/  / // |/ /,'_/\n")
	terminalHeader += (" / /_/ o |/ /_n/ /_n / // || // /_n\n")
	terminalHeader += ("/___/|_,' |__,'|__,'/_//_/|_/ |__,'\n")
	terminalHeader += ("   __  ___  _  __ _____ ___  ___   \n")
	terminalHeader += (" ,'_/ / _/ / |/ //_  _// _/ / o |  \n")
	terminalHeader += ("/ /_ / _/ / || /  / / / _/ /  ,'   \n")
	terminalHeader += ("|__//___//_/|_/  /_/ /___//_/`_\\   \n")
	terminalHeader += ("                                   \n")

	terminalFooter := ("   __ _  __ ____ __ _  __ __    __ _____ __                         \n")
	terminalFooter += ("  / // |/ // __// // |/ // /   / //_  _//  \\                        \n")
	terminalFooter += (" / // || // _/ / // || // /   / /_ / / / o |                        \n")
	terminalFooter += ("/_//_/|_//_/  /_//_/|_//_/() /___//_/ /__,'    \n\n")
	terminalFooter += ("©2020 INFINI.LTD, All Rights Reserved.\n")

	app := framework.NewApp("logging-center", "the easiest way to operate your own logging center.",
		config.Version, config.LastCommitLog, config.BuildDate, terminalHeader, terminalFooter)

	app.Init(nil)
	defer app.Shutdown()

	app.Start(func() {

		//load core modules first
		modules.Register()

		appConfig = &config.AppConfig{
			ElasticConfig:  "default",
			UILocalPath:    ".public",
			UIVFSEnabled:   true,
			UILocalEnabled: true,
		}

		ok, err := env.ParseConfig("logging-center", appConfig)
		if err != nil {
			panic(err)
		}
		if !ok {
			panic(errors.New("config not exists"))
		}

		//load web UI files
		appUI = &UI{config: appConfig}
		appUI.InitUI()

		//start each module, with enabled provider
		module.Start()

	}, func() {

	})

}
