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
	"time"

	log "github.com/cihub/seelog"
	"infini.sh/console/model/alerting"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

func InitTasks() error {
	//fetch alerting rules from es
	q := orm.Query{
		Size: 10000,
		//WildcardIndex: true,
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
			ID:          rule.ID,
			Interval:    rule.Schedule.Interval,
			Description: rule.Metrics.Expression,
			Task:        eng.GenerateTask(*rule),
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
		RawQuery:      util.MustToJSONBytes(query),
		Size:          1000,
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
	RuleID  string    `json:"rule_id"`
}
