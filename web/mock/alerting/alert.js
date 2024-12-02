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

export default {
  //filter object, timestamp, severity, status
  "GET /alerting/alert/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 1, relation: "eq" },
        max_score: 1.0,
        hits: [
          {
            _index: ".infini_alerting-alert",
            _type: "_doc",
            _id: "c97um9tath2fgbc3jbsg",
            _score: 1.0,
            _source: {
              id: "c9fnli1pdamjthv04i1g",
              created: "2022-04-20T11:15:20.124584+08:00",
              updated: "2022-04-20T11:15:20.124585+08:00",
              rule_id: "c9f95o1pdamhls3hlaug",
              resource_id: "c9aikmhpdamkiurn1vq0",
              resource_name: "lsy_cluster_1",
              expression:
                "avg(payload.elasticsearch.cluster_stats.indices.count)",
              objects: [".infini_metrics"],
              severity: "warning",
              content: "",
              action_execution_results: null,
              state: "active",
              is_notified: false,
              is_escalated: false,
              message: "磁盘可用率小于10%",
              status: "acknowledge",
              user: "张三",
            },
          },
        ],
      },
    });
  },
  "GET /alerting/stats": function(req, res) {
    res.send({
      alert: {
        current: {
          critical: 0, //严重告警数量
          error: 0, //重要告警数量
          warning: 3033, //提示告警数量
        },
      },
    });
  },
  "GET /alerting/alert/:event_id": function(req, res) {
    // res.send({
    //   "_id": "c9ucql9pdamk14qcf5801",
    //   "found": false
    // });
    res.send({
      _id: "c9utpq9pdamo0g92072g",
      _source: {
        id: "c9utpq9pdamo0g92072g",
        created: "2022-05-13T12:22:01.330944+08:00",
        updated: "2022-05-13T12:22:01.330944+08:00",
        rule_id: "c9jr33hpdamplb9llpc0",
        resource_id: "c9aikmhpdamkiurn1vq0",
        resource_name: "lsy_cluster_1",
        expression: "count(payload.elasticsearch.cluster_health.status)",
        objects: [".infini_metrics"],
        severity: "warning",
        content: "",
      },
      found: true,
    });
  },
  "DELETE /alerting/alert/:alert_id": function(req, res) {
    //change alert status to deleted
    res.send({
      result: "deleted",
    });
  },
  //{"ids":["aaa", "bbb"], "user": "xxx"}
  "POST /alerting/alert/_acknowledge": function(req, res) {
    //change alert status to acknowledge, and update handle user
    res.send({
      result: "updated",
    });
  },
};
