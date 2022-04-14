/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"context"
	"fmt"
	"infini.sh/console/model/alerting"
	"sync"
)

type Engine interface {
	GenerateQuery(rule *alerting.Rule) (interface{}, error)
	ExecuteQuery(rule *alerting.Rule)([]alerting.MetricData, error)
	CheckCondition(rule *alerting.Rule)([]alerting.ConditionResult, error)
	GenerateTask(rule *alerting.Rule) func(ctx context.Context)
}

var (
	alertEngines = map[string] Engine{}
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