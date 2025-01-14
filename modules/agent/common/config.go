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
	log "github.com/cihub/seelog"
	"infini.sh/console/modules/agent/model"
	"infini.sh/framework/core/env"
	"infini.sh/framework/modules/configs/common"
)

func GetAgentConfig() *model.AgentConfig {
	agentCfg := &model.AgentConfig{
		Enabled: true,
		Setup: &model.SetupConfig{
			DownloadURL: "https://release.infinilabs.com/agent/stable",
		},
	}
	_, err := env.ParseConfig("agent", agentCfg)
	if err != nil {
		log.Errorf("agent config not found: %v", err)
	}
	if agentCfg.Setup.CACertFile == "" && agentCfg.Setup.CAKeyFile == "" {
		agentCfg.Setup.CACertFile, agentCfg.Setup.CAKeyFile, err = common.GetOrInitDefaultCaCerts()
		if err != nil {
			log.Errorf("generate default ca certs error: %v", err)
		}
	}
	return agentCfg
}
