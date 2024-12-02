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
  "GET /elasticsearch/_search": function(req, res) {
    res.send({
      took: 4,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: 6,
        },
        max_score: 1,
        hits: [
          {
            _index: ".infini_cluster",
            _type: "_doc",
            _id: "c0oc4kkgq9s8qss2uk50",
            _source: {
              basic_auth: {},
              created: "2021-12-03T10:12:29.639267+08:00",
              discovery: {
                refresh: {},
              },
              enabled: true,
              endpoint: "http://192.168.3.188:9202",
              host: "192.168.3.188:9202",
              monitored: true,
              name: "cluster1",
              schema: "http",
              updated: "2021-12-03T10:12:29.639267+08:00",
              version: "2.4.6",
            },
          },
          {
            _index: ".infini_cluster",
            _type: "_doc",
            _id: "c0oc4kkgq9s8qss2uk51",
            _source: {
              basic_auth: {},
              created: "2021-12-03T10:21:31.195595+08:00",
              discovery: {
                refresh: {},
              },
              enabled: true,
              endpoint: "http://192.168.3.188:9200",
              host: "192.168.3.188:9200",
              monitored: true,
              name: "cluster2",
              schema: "http",
              updated: "2021-12-03T10:21:31.195595+08:00",
              version: "5.6.8",
            },
          },
          {
            _index: ".infini_cluster",
            _type: "_doc",
            _id: "c0oc4kkgq9s8qss2u710",
            _source: {
              basic_auth: {},
              created: "2022-01-03T10:21:31.195595+08:00",
              discovery: {
                refresh: {},
              },
              enabled: true,
              endpoint: "http://192.168.3.188:9200",
              host: "192.168.3.188:9200",
              monitored: true,
              name: "es-710",
              schema: "http",
              updated: "2022-01-03T10:21:31.195595+08:00",
              version: "7.10.0",
            },
          },
          {
            _index: ".infini_cluster",
            _type: "_doc",
            _id: "c0oc4kkgq9s8qss2uk830",
            _source: {
              basic_auth: {},
              created: "2022-10-03T10:21:31.195595+08:00",
              discovery: {
                refresh: {},
              },
              enabled: true,
              endpoint: "http://192.168.3.188:9200",
              host: "192.168.3.188:9200",
              monitored: true,
              name: "es830",
              schema: "http",
              updated: "2022-10-03T10:21:31.195595+08:00",
              version: "8.3.0",
            },
          },
        ],
      },
    });
  },
  "POST /elasticsearch/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: 1,
        },
        max_score: 1,
        hits: [
          {
            _index: ".infini-search-center_cluster",
            _type: "_doc",
            _id: "c0oc4kkgq9s8qss2uk50",
            _source: {
              basic_auth: {
                password: "123",
                username: "medcl",
              },
              created: "2021-02-20T16:03:30.867084+08:00",
              description: "xx业务集群1",
              enabled: false,
              monitored: true,
              endpoint: "http://localhost:9200",
              name: "cluster1",
              updated: "2021-02-20T16:03:30.867084+08:00",
            },
          },
        ],
      },
    });
  },
  "POST /elasticsearch": function(req, res) {
    res.send({
      _id: "c0oc4kkgq9s8qss2uk50",
      _source: {
        name: "cluster1",
        endpoint: "http://localhost:9200",
        basic_auth: {
          username: "medcl",
          password: "123",
        },
        description: "xx业务集群1",
        enabled: false,
        monitored: true,
        created: "2021-02-20T15:12:50.984062+08:00",
        updated: "2021-02-20T15:12:50.984062+08:00",
      },
      result: "created",
    });
  },
  "PUT /elasticsearch/:id": function(req, res) {
    res.send({
      _id: "c0oc4kkgq9s8qss2uk50",
      _source: {
        basic_auth: {
          password: "456",
          username: "medcl",
        },
        description: "xx业务集群2",
        endpoint: "http://localhost:9201",
        name: "cluster2",
        enabled: true,
        monitored: true,
        updated: "2021-02-20T15:25:12.159789+08:00",
      },
      result: "updated",
    });
  },
  "DELETE /elasticsearch/:id": function(req, res) {
    res.send({
      _id: "c0oc4kkgq9s8qss2uk50",
      result: "deleted",
    });
  },
  "GET /elasticsearch/status": function(req, res) {
    res.send({
      c0oc4kkgq9s8qss2uk50: {
        available: true,
        config: {
          monitored: true,
        },
        health: {
          cluster_name: "cluster1",
          status: "green",
          timed_out: false,
          number_of_nodes: 1000,
          number_of_data_nodes: 1000,
          active_primary_shards: 50000006,
          active_shards: 50000006,
          relocating_shards: 0,
          initializing_shards: 0,
          unassigned_shards: 3700000,
          delayed_unassigned_shards: 0,
          number_of_pending_tasks: 0,
          number_of_in_flight_fetch: 0,
          task_max_waiting_in_queue_millis: 0,
          active_shards_percent_as_number: 60.215053763440864,
        },
      },
      c0oc4kkgq9s8qss2uk51: {
        available: true,
        config: {
          monitored: true,
        },
        health: {
          cluster_name: "cluster2",
          status: "yellow",
          timed_out: false,
          number_of_nodes: 1,
          number_of_data_nodes: 1,
          active_primary_shards: 31,
          active_shards: 31,
          relocating_shards: 0,
          initializing_shards: 0,
          unassigned_shards: 29,
          delayed_unassigned_shards: 0,
          number_of_pending_tasks: 0,
          number_of_in_flight_fetch: 0,
          task_max_waiting_in_queue_millis: 0,
          active_shards_percent_as_number: 51.66666666666667,
        },
      },
    });
  },

  "GET /elasticsearch/:id/info": function(req, res) {
    res.send({
      cluster_name: "cluster1",
      status: "green",
      timed_out: false,
      number_of_nodes: 1000,
      number_of_data_nodes: 1000,
      active_primary_shards: 50000006,
      active_shards: 50000006,
      relocating_shards: 0,
      initializing_shards: 0,
      unassigned_shards: 3700000,
      delayed_unassigned_shards: 0,
      number_of_pending_tasks: 0,
      number_of_in_flight_fetch: 0,
      task_max_waiting_in_queue_millis: 0,
      active_shards_percent_as_number: 60.215,
    });
  },
  ///_search-center/cluster/indices?ids=c97rd2les10hml00pgh0&keyword=lob
  "GET /_search-center/cluster/indices": (req, res) => {
    res.send({
      indexnames: [".infini_blob"],
    });
  },
};
