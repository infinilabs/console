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

/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"fmt"
	"os"
	"path"
	"time"

	"gopkg.in/yaml.v2"
	"infini.sh/console/model"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/keystore"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

const emailServerConfigFile = "send_email.yml"

func RefreshEmailServer() error {
	q := orm.Query{
		Size: 10,
	}
	q.Conds = orm.And(orm.Eq("enabled", true))
	err, result := orm.Search(model.EmailServer{}, &q)
	if err != nil {
		return err
	}
	if len(result.Result) == 0 {
		return StopEmailServer()
	}
	servers := make([]model.EmailServer, 0, len(result.Result))
	for _, row := range result.Result {
		emailServer := model.EmailServer{}
		buf := util.MustToJSONBytes(row)
		util.MustFromJSONBytes(buf, &emailServer)
		err = emailServer.Validate(false)
		if err != nil {
			return err
		}
		auth, err := GetBasicAuth(&emailServer)
		if err != nil {
			return err
		}
		emailServer.Auth = &auth
		servers = append(servers, emailServer)
	}
	pipeCfgStr, err := GeneratePipelineConfig(servers)
	if err != nil {
		return err
	}
	cfgDir := global.Env().GetConfigDir()
	sendEmailCfgFile := path.Join(cfgDir, emailServerConfigFile)
	_, err = util.FilePutContent(sendEmailCfgFile, pipeCfgStr)
	return err
}

func StopEmailServer() error {
	cfgDir := global.Env().GetConfigDir()
	sendEmailCfgFile := path.Join(cfgDir, emailServerConfigFile)
	if util.FilesExists(sendEmailCfgFile) {
		return os.RemoveAll(sendEmailCfgFile)
	}
	return nil
}

func CheckEmailPipelineExists() bool {
	cfgDir := global.Env().GetConfigDir()
	sendEmailCfgFile := path.Join(cfgDir, emailServerConfigFile)
	return util.FilesExists(sendEmailCfgFile)
}

func getEmailPasswordKey(srv model.EmailServer) string {
	return fmt.Sprintf("%s_password", srv.ID)
}

func GeneratePipelineConfig(servers []model.EmailServer) (string, error) {
	if len(servers) == 0 {
		return "", nil
	}
	smtpServers := map[string]util.MapStr{}
	for _, srv := range servers {
		key := getEmailPasswordKey(srv)
		err := keystore.SetValue(key, []byte(srv.Auth.Password.Get()))
		if err != nil {
			return "", err
		}
		smtpServers[srv.ID] = util.MapStr{
			"server": util.MapStr{
				"host":              srv.Host,
				"port":              srv.Port,
				"tls":               srv.TLS,
				"refresh_timestamp": time.Now().UnixMilli(),
			},
			"min_tls_version": srv.TLSMinVersion,
			"auth": util.MapStr{
				"username": srv.Auth.Username,
				"password": fmt.Sprintf("$[[keystore.%s]]", key),
			},
		}
	}

	pipelineCfg := util.MapStr{
		"pipeline": []util.MapStr{
			{
				"name":              "send_email_service",
				"auto_start":        true,
				"keep_running":      true,
				"retry_delay_in_ms": 5000,
				"processor": []util.MapStr{
					{
						"consumer": util.MapStr{
							"consumer": util.MapStr{
								"fetch_max_messages": 1,
							},
							"max_worker_size":         200,
							"num_of_slices":           1,
							"idle_timeout_in_seconds": 30,
							"queue_selector": util.MapStr{
								"keys": []string{"email_messages"},
							},
							"processor": []util.MapStr{
								{
									"smtp": util.MapStr{
										"idle_timeout_in_seconds": 1,
										"servers":                 smtpServers,
										"templates": util.MapStr{
											"raw": util.MapStr{
												"content_type": "text/plain",
												"subject":      "$[[subject]]",
												"body":         "$[[body]]",
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	buf, err := yaml.Marshal(pipelineCfg)
	if err != nil {
		return "", err
	}
	return string(buf), nil
}
