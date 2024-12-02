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

const groupList = [
  {
    _index: ".infini_gateway_group",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk90",
    _source: {
      name: "default_group",
      owner: "infini",
      description: "华东区",
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
  {
    _index: ".infini_gateway_group",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk91",
    _source: {
      name: "上海",
      owner: "infini",
      description: "华东区",
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
  {
    _index: ".infini_gateway_group",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk92",
    _source: {
      name: "北京",
      owner: "infini",
      description: "华东区",
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
];

export default {
  "GET /gateway/group/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: groupList.length,
        },
        max_score: 1,
        hits: groupList,
      },
    });
  },
  "POST /gateway/group": function(req, res) {
    let newGroup = {
      _index: ".infini_gateway_group",
      _type: "_doc",
      _id: new Date().valueOf() + Math.random(),
      _source: {
        ...req.body,
        updated: new Date().toISOString(),
      },
    };
    groupList.push(newGroup);
    res.send({
      ...newGroup,
      result: "created",
    });
  },
  "PUT /gateway/group/:group_id": function(req, res) {
    res.send({
      _id: req.params.group_id,
      _source: {
        ...req.body,
        updated: new Date().toISOString(),
      },
      result: "updated",
    });
  },
  "DELETE /gateway/group/:group_id": function(req, res) {
    res.send({
      _id: req.params.group_id,
      result: "deleted",
    });
  },
  "GET /gateway/group/:group_id": function(req, res) {
    const group = groupList.find((en) => en._id == req.params.group_id);
    res.send(group);
  },
};
