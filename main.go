// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

package main

import (
	"context"
	"errors"
	_ "expvar"
	"fmt"
	api3 "infini.sh/console/modules/agent/api"
	common2 "infini.sh/console/modules/agent/common"
	uiapi "infini.sh/console/plugin/api"
	"infini.sh/console/plugin/api/email"
	"infini.sh/console/plugin/audit_log"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/host"
	model2 "infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
	elastic2 "infini.sh/framework/modules/elastic"
	"os"
	_ "time/tzdata"

	log "github.com/cihub/seelog"
	"infini.sh/console/config"
	"infini.sh/console/model"
	"infini.sh/console/model/alerting"
	"infini.sh/console/model/insight"
	"infini.sh/console/modules/security"
	_ "infini.sh/console/plugin"
	_ "infini.sh/console/plugin/managed"
	setup1 "infini.sh/console/plugin/setup"
	alerting2 "infini.sh/console/service/alerting"
	"infini.sh/framework"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/module"
	"infini.sh/framework/core/orm"
	task1 "infini.sh/framework/core/task"
	apimodule "infini.sh/framework/modules/api"
	"infini.sh/framework/modules/metrics"
	"infini.sh/framework/modules/pipeline"
	queue2 "infini.sh/framework/modules/queue/disk_queue"
	"infini.sh/framework/modules/redis"
	"infini.sh/framework/modules/stats"
	"infini.sh/framework/modules/task"
	"infini.sh/framework/modules/web"
	_ "infini.sh/framework/plugins"
)

var appConfig *config.AppConfig
var appUI *UI

func lookupSystemClusterID() (string, bool) {
	value := global.Lookup(elastic.GlobalSystemElasticsearchID)
	systemID, ok := value.(string)
	if !ok || systemID == "" {
		return "", false
	}
	return systemID, true
}

func getSystemClusterClient() (elastic.API, bool) {
	systemID, ok := lookupSystemClusterID()
	if !ok {
		return nil, false
	}

	client := elastic.GetClientNoPanic(systemID)
	if client == nil {
		return nil, false
	}
	return client, true
}

func isSystemClusterRollupSupported(cfg *elastic.ElasticsearchConfig) bool {
	if cfg == nil || cfg.Distribution != elastic.Easysearch || cfg.Version == "" {
		return false
	}

	version, err := util.ParseSemantic(cfg.Version)
	if err != nil {
		log.Warnf("failed to parse system cluster version [%s] for rollup support: %v", cfg.Version, err)
		return false
	}

	return version.AtLeast(util.MustParseSemantic("1.12.1"))
}

func getSystemClusterAppSetting() interface{} {
	client, ok := getSystemClusterClient()
	if !ok {
		return nil
	}

	systemID, ok := lookupSystemClusterID()
	if !ok {
		return nil
	}

	cfg := elastic.GetConfigNoPanic(systemID)
	if cfg == nil {
		return nil
	}

	settings, err := client.GetClusterSettings(nil)
	if err != nil {
		log.Errorf("failed to get cluster settings with system cluster: %v", err)
		return nil
	}

	rollupEnabled, _ := util.GetMapValueByKeys([]string{"persistent", "rollup", "search", "enabled"}, settings)
	rollupEnabledValue := false
	if v, ok := rollupEnabled.(string); ok && v == "true" {
		rollupEnabledValue = true
	}
	return map[string]interface{}{
		"distribution":     cfg.Distribution,
		"version":          cfg.Version,
		"rollup_enabled":   rollupEnabledValue,
		"rollup_supported": isSystemClusterRollupSupported(cfg),
	}
}

func main() {
	terminalHeader := ("\n")
	terminalHeader += ("   ___  ___    __  __    ___  __   __ \n")
	terminalHeader += ("  / __\\/___\\/\\ \\ \\/ _\\  /___\\/ /  /__\\\n")
	terminalHeader += (" / /  //  //  \\/ /\\ \\  //  // /  /_\\  \n")
	terminalHeader += ("/ /__/ \\_// /\\  / _\\ \\/ \\_// /__//__  \n")
	terminalHeader += ("\\____|___/\\_\\ \\/  \\__/\\___/\\____|__/  \n\n")
	terminalHeader += ("HOME: https://github.com/infinilabs/console/\n\n")

	terminalFooter := ""

	app := framework.NewApp("console", "The easiest way to operate your own search platform, open-sourced under the GNU AGPLv3.",
		config.Version, config.BuildNumber, config.LastCommitLog, config.BuildDate, config.EOLDate, terminalHeader, terminalFooter)

	app.Init(nil)
	if len(os.Args) > 1 && os.Args[1] == "recovery" {
		if err := setup1.RunRecoveryCmd(os.Args[2:]); err != nil {
			fmt.Println(err.Error())
			app.Shutdown()
			os.Exit(1)
		}
		app.Shutdown()
		return
	}
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

	uiModule := &web.WebModule{}

	global.Env().EnableSetup(true)

	if app.Setup(func() {

		//load core modules first
		module.RegisterSystemModule(&setup1.Module{})
		module.RegisterSystemModule(uiModule)
		module.RegisterSystemModule(&apimodule.APIModule{})

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

		api.AddGlobalInterceptors(new(audit_log.MonitoringInterceptor))

	}, func() {
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
		orm.RegisterSchemaWithIndexName(common2.PendingRegistrationToken{}, "agent-registration-token")
		orm.RegisterSchemaWithIndexName(api3.RemoteConfig{}, "configs")
		orm.RegisterSchemaWithIndexName(model.AuditLog{}, "audit-logs")
		orm.RegisterSchemaWithIndexName(host.HostInfo{}, "host")

		module.Start()
		uiapi.RefreshConsoleSelfAPIProxyUIRoutes()

		var initFunc = func(startDeferredModules bool) {
			// check cluster health before initialization, refuse to start if status is red
			if err := setup1.EnsureSystemClusterBasicAuth(); err != nil {
				panic(fmt.Errorf("failed to hydrate system cluster auth: %v", err))
			}
			client, ok := getSystemClusterClient()
			if !ok {
				log.Warn("skip system cluster post-initialization, system cluster is not available")
			} else {
				health, err := client.ClusterHealth(context.Background())
				if err != nil {
					panic(fmt.Errorf("failed to get system cluster health: %v", err))
				}
				if health != nil && health.Status == "red" {
					panic(fmt.Errorf("system cluster health status is [red], please fix the cluster before starting"))
				}

				elastic2.InitTemplate(false)
			}

			if startDeferredModules {
				for k, v := range modules {
					log.Debugf("start module: %v", k)
					v.Value.Start()
				}
			}

			if orm.HasHandler() {
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
			} else {
				log.Warn("skip alerting and email initialization, ORM handler is not registered")
			}
			api.RegisterAppSetting("system_cluster", getSystemClusterAppSetting)
		}

		if !global.Env().SetupRequired() {
			initFunc(false)
		} else {
			setup1.RegisterSetupCallback(func() {
				initFunc(true)
			})
		}

		if !global.Env().SetupRequired() {
			if _, ok := lookupSystemClusterID(); !ok {
				log.Warn("skip bootstrap requirement check, system cluster is not available")
			} else {
				err := bootstrapRequirementCheck()
				if err != nil {
					panic(err)
				}
			}
		}

	}, nil) {
		app.Run()
	}

}
