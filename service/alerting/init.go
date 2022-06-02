/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"infini.sh/console/model/alerting"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	log "src/github.com/cihub/seelog"
	"time"
)

func InitTasks() error {
	//fetch alerting rules from es
	q := orm.Query{
		Size: 10000,
		WildcardIndex: true,
	}
	q.Conds = orm.And(orm.Eq("enabled", true))
	err, result := orm.Search(alerting.Rule{}, &q)
	if err != nil {
		return err
	}
	for _, ruleM := range result.Result {
		rb := util.MustToJSONBytes(ruleM)
		rule := &alerting.Rule{}
		err = util.FromJSONBytes(rb, rule)
		if err != nil {
			return err
		}
		if !rule.Enabled {
			continue
		}
		eng := GetEngine(rule.Resource.Type)
		task.RegisterScheduleTask(task.ScheduleTask{
			ID: rule.ID,
			Interval: rule.Schedule.Interval,
			Description: rule.Metrics.Expression,
			Task: eng.GenerateTask(*rule),
		})
		task.StartTask(rule.ID)
	}
	return nil
}

func getRuleLastTermTime() (map[string]time.Time, error) {
	query := util.MapStr{
		"_source": "created",
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "desc",
				},
			},
		},
		"collapse": util.MapStr{
			"field": "rule_id",
		},
		"query": util.MapStr{
			"term": util.MapStr{
				"state": util.MapStr{
					"value": "normal",
				},
			},
		},
	}
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(query),
		Size: 1000,
		WildcardIndex: true,
	}
	err, result := orm.Search(alerting.Alert{}, q)
	if err != nil {
		return nil, err
	}

	times := map[string]time.Time{}
	obj := &ruleTime{}
	for _, item := range result.Result {
		itemBytes := util.MustToJSONBytes(item)
		err = util.FromJSONBytes(itemBytes, obj)
		if err != nil {
			log.Error(err)
			continue
		}
		times[obj.RuleID] = obj.Created
	}
	return times, nil
}

type ruleTime struct {
	Created time.Time `json:"created"`
	RuleID string `json:"rule_id"`
}
