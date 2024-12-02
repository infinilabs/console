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

const sourceItem = {
  id: "c97um9tath2fgbc3jbsg",
  created: "2022-06-14T10:58:31.318579+08:00",
  updated: "2022-06-14T10:58:31.318579+08:00",
  enabled: true,
  name: "复制任务1",
  source_cluster_id: "c97um9tath2fgbc3jbs1",
  source_cluster_name: "Cluster-A",
  target_cluster_id: "c97um9tath2fgbc3jbs2",
  target_cluster_name: "Cluster-B",
};

export default {
  "POST /migration/replication": function(req, res) {
    res.send({
      _id: "c97um9tath2fgbc3jbsg",
      _source: sourceItem,
      result: "created",
    });
  },
  "GET /migration/replication/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 1, relation: "eq" },
        max_score: 1.0,
        hits: [
          {
            _index: ".infini_migration-replication",
            _type: "_doc",
            _id: "c97um9tath2fgbc3jbsg",
            _score: 1.0,
            _source: {
              ...sourceItem,
            },
          },
        ],
      },
    });
  },
  "GET /migration/replication/:id": function(req, res) {
    res.send({
      found: true,
      _id: "c97um9tath2fgbc3jbsg",
      _source: sourceItem,
    });
  },

  "PUT /migration/replication/:id": function(req, res) {
    sourceItem.updated = new Date();
    res.send({
      _id: "c97um9tath2fgbc3jbsg",
      _source: replication,
      result: "updated",
    });
  },
  "DELETE /migration/replication/:id": function(req, res) {
    //移除对应任务
    res.send({
      result: "deleted",
    });
  },
  //{"enabled": false}
  "POST /migration/replication/:id/_enable": function(req, res) {
    //关闭开启任务
    res.send({
      result: "updated",
    });
  },
};
