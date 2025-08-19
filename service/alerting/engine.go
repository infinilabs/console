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
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"context"
	"fmt"
	"sync"

	"infini.sh/console/core/insight"
	"infini.sh/console/model/alerting"
)

type Engine interface {
	GenerateQuery(rule *alerting.Rule, filterParam *alerting.FilterParam) (interface{}, error)
	ExecuteQuery(rule *alerting.Rule, filterParam *alerting.FilterParam) (*alerting.QueryResult, error)
	CheckCondition(rule *alerting.Rule) (*alerting.ConditionResult, error)
	GenerateTask(rule alerting.Rule) func(ctx context.Context)
	Test(rule *alerting.Rule, msgType string) ([]alerting.ActionExecutionResult, error)
	GetTargetMetricData(rule *alerting.Rule, isFilterNaN bool, filterParam *alerting.FilterParam) ([]insight.MetricData, *alerting.QueryResult, error)
}

var (
	alertEngines      = map[string]Engine{}
	alertEnginesMutex = sync.RWMutex{}
)

func RegistEngine(typ string, engine Engine) {
	alertEnginesMutex.Lock()
	defer alertEnginesMutex.Unlock()
	alertEngines[typ] = engine
}

func GetEngine(typ string) Engine {
	alertEnginesMutex.RLock()
	eng, ok := alertEngines[typ]
	alertEnginesMutex.RUnlock()
	if !ok {
		panic(fmt.Sprintf("alert engine of type: %s not found", typ))
	}
	return eng
}
