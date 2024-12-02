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
  //通过 collection_name 获取搜索结果
  "POST /collection/:name/_search": function(req, res) {
    //:name = cluster
    res.send({
      took: 0,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: 2,
        },
        max_score: 1,
        hits: [
          {
            _index: ".infini_cluster",
            _type: "_doc",
            _id: "infini_default_system_cluster",
            _source: {
              basic_auth: {},
              cluster_uuid: "MsGuOKBGReqKSS8FGMIy_A",
              created: "2023-10-30T14:59:51.621483+08:00",
              discovery: {
                refresh: {},
              },
              distribution: "elasticsearch",
              enabled: true,
              endpoint: "http://localhost:9200",
              host: "localhost:9200",
              id: "infini_default_system_cluster",
              labels: {
                health_status: "yellow",
              },
              monitored: true,
              name: "INFINI_SYSTEM (Orchid)",
              raw_name: "lsy_v717",
              request_timeout: 30,
              reserved: true,
              schema: "http",
              source: "elastic",
              updated: "2023-10-30T14:59:53.905103+08:00",
              version: "7.17.14",
            },
          },
          {
            _index: ".infini_cluster",
            _type: "_doc",
            _id: "ckvms2rp785hj14vmvng",
            _source: {
              cluster_uuid: "EgJNIk3GQHiQTc5kHGZSAg",
              created: "2023-10-30T16:49:15.869134+08:00",
              credential_id: "ckvms2rp785hj14vmvo0",
              description: "Local",
              discovery: {
                enabled: true,
                refresh: {},
              },
              distribution: "easysearch",
              enabled: true,
              endpoint: "https://localhost:9288",
              host: "localhost:9288",
              id: "ckvms2rp785hj14vmvng",
              labels: {
                health_status: "green",
              },
              location: {
                provider: "on-premises",
                region: "changsha",
              },
              metadata_configs: {
                cluster_settings_check: {
                  enabled: true,
                  interval: "10s",
                },
                health_check: {
                  enabled: true,
                  interval: "10s",
                },
                metadata_refresh: {
                  enabled: true,
                  interval: "10s",
                },
                node_availability_check: {
                  enabled: true,
                  interval: "10s",
                },
              },
              monitor_configs: {
                cluster_health: {
                  enabled: true,
                  interval: "10s",
                },
                cluster_stats: {
                  enabled: true,
                  interval: "10s",
                },
                index_stats: {
                  enabled: false,
                  interval: "10s",
                },
                node_stats: {
                  enabled: false,
                  interval: "10s",
                },
              },
              monitored: true,
              name: "ezs-lsy-local",
              raw_name: "ezs-lsy-local",
              schema: "https",
              tags: ["default"],
              updated: "2023-10-30T16:49:25.006216+08:00",
              version: "1.6.1",
            },
          },
        ],
      },
      aggregations: {
        Cluster: {},
        Health: {},
        State: {},
      },
    });
  },
  //通过 collection_name 获取真实索引名
  "GET /collection/:name/metadata": function(req, res) {
    //:name = cluster
    res.send({
      collection_name: "cluster",
      metadata: {
        index_name: ".infini_cluster",
      },
    });
  },
};
