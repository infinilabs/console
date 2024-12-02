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

const destItem = {
  id: "c97auilath2e80qba16g",
  created: "2022-04-08T14:03:26.524693+08:00",
  updated: "2022-04-08T14:03:26.524693+08:00",
  name: "钉钉",
  type: "webhook",
  webhook: {
    header_params: { "Content-Type": "application/json" },
    method: "POST",
    url: "https://oapi.dingtalk.com/robot/send?access_token=XXXXXX",
    body: '{"msgtype": "text","text": {"content":"告警通知: $message"}}',
  },
};

export default {
  "POST /alerting/channel": function(req, res) {
    res.send({
      _id: "c97auilath2e80qba16g",
      _source: destItem,
      result: "created",
    });
  },
  "GET /alerting/channel/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 1, relation: "eq" },
        max_score: 1.0,
        hits: [
          {
            _index: ".infini_alerting-channel",
            _type: "_doc",
            _id: "c97auilath2e80qba16g",
            _score: 1.0,
            _source: destItem,
          },
        ],
      },
    });
  },
  "GET /alerting/channel/:id": function(req, res) {
    res.send({ 
      found: true, 
      _id: "c97auilath2e80qba16g", 
      _source: destItem,
    });
  },

  "PUT /alerting/channel/:id": function(req, res) {
    destItem.updated = new Date();
    res.send({
      _id: "c97auilath2e80qba16g",
      _source: destItem,
      result: "updated",
    });
  },
};
