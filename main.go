package main

import (
	"errors"
	_ "expvar"
	"infini.sh/framework"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/module"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/modules"
	"infini.sh/search-center/config"
	"infini.sh/search-center/model"
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
	terminalHeader += ("     \\/     \\/      \\/            \\/           \n")

	terminalFooter := ("   __ _  __ ____ __ _  __ __    __ _____ __                         \n")
	terminalFooter += ("  / // |/ // __// // |/ // /   / //_  _//  \\                        \n")
	terminalFooter += (" / // || // _/ / // || // /   / /_ / / / o |                        \n")
	terminalFooter += ("/_//_/|_//_/  /_//_/|_//_/() /___//_/ /__,'    \n\n")
	terminalFooter += ("©INFINI.LTD, All Rights Reserved.\n")

	app := framework.NewApp("search-center", "the easiest way to operate your own search center.",
		config.Version, config.LastCommitLog, config.BuildDate,config.EOLDate, terminalHeader, terminalFooter)

	app.Init(nil)
	defer app.Shutdown()

	app.Start(func() {

		//load core modules first
		modules.Register()

		appConfig = &config.AppConfig{
			Elasticsearch:  "default",
			UILocalPath:    ".public",
			UIVFSEnabled:   true,
			UILocalEnabled: true,
		}

		ok, err := env.ParseConfig("search-center", appConfig)
		if err != nil {
			panic(err)
		}
		if !ok {
			panic(errors.New("config not exists"))
		}

		//load web UI files
		appUI = &UI{Config: appConfig}
		appUI.InitUI()

		//start each module, with enabled provider
		module.Start()

	}, func() {
		orm.RegisterSchemaWithIndexName(model.Dict{}, "dict")
		orm.RegisterSchemaWithIndexName(model.Reindex{}, "reindex")
		orm.RegisterSchemaWithIndexName(elastic.IndexPattern{}, "view")
	})

}
