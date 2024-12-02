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

const data = {
  payload: {
    blogs: {
      id: "3YOmOx_BSDqF-6EqAzBLVg",
      index: "blogs",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
      docs_count: 3,
    },
    dict: {
      id: "F6vp1k_XRn-FmXoHOsBl2Q",
      index: "dict",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
      docs_count: 8,
      docs_deleted: 1,
    },
    gateway_requests: {
      id: "C0j0942KR6muJMHyagG2AQ",
      index: "gateway_requests",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
      docs_count: 17961,
    },
    "metricbeat-7.10.0-2020.11.24-000001": {
      id: "j5hJlvknQliWmVvdLVSH7w",
      index: "metricbeat-7.10.0-2020.11.24-000001",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
      docs_count: 257315,
    },
    "metricbeat-7.10.0-2020.12.24-000002": {
      id: "Q3f7CTSfScCLTUCBKURzCw",
      index: "metricbeat-7.10.0-2020.12.24-000002",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
    },
    mock_log: {
      id: "NI7ntH_YRHapvjqB30LFQA",
      index: "mock_log",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
      docs_count: 45806,
    },
    mock_log1: {
      id: "FEuAjVAYTCG5FJSVqjB4cA",
      index: "mock_log1",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
      docs_count: 45806,
    },
    reindex: {
      id: "o7x8G6csQbyAMrWYqZOojA",
      index: "reindex",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
    },
    "test-custom": {
      id: "17I4JLDWRdGrBL15sL3qIA",
      index: "test-custom",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
      docs_count: 12,
      docs_deleted: 1,
    },
    "test-custom1": {
      id: "SEpAkmImQsGD0zVCHMtteQ",
      index: "test-custom1",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
      docs_count: 4,
    },
    "test-custom8": {
      id: "PyHOJ_ytQxCzeamGBhs1_Q",
      index: "test-custom8",
      status: "open",
      health: "green",
      shards: 1,
      replicas: 1,
      docs_count: 12,
    },
  },
  status: true,
};

const mappings = {
  payload: {
    blogs: {
      mappings: {
        properties: {
          created_at: {
            type: "date",
          },
          test_field: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          test_field2: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          title: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          view_count: {
            type: "long",
          },
        },
      },
    },
    dict: {
      mappings: {
        properties: {
          content: {
            type: "binary",
          },
          created_at: {
            type: "date",
          },
          id: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          name: {
            type: "text",
          },
          tags: {
            type: "text",
          },
          updated_at: {
            type: "date",
          },
        },
      },
    },
    gateway_requests: {
      mappings: {
        dynamic_templates: [
          {
            strings: {
              mapping: {
                ignore_above: 256,
                type: "keyword",
              },
              match_mapping_type: "string",
            },
          },
        ],
        properties: {
          "@timestamp": {
            type: "date",
          },
          conn_time: {
            type: "date",
          },
          flow: {
            properties: {
              from: {
                ignore_above: 256,
                type: "keyword",
              },
              relay: {
                ignore_above: 256,
                type: "keyword",
              },
              to: {
                ignore_above: 256,
                type: "keyword",
              },
            },
          },
          id: {
            type: "long",
          },
          local_ip: {
            ignore_above: 256,
            type: "keyword",
          },
          remote_ip: {
            ignore_above: 256,
            type: "keyword",
          },
          request: {
            properties: {
              body: {
                ignore_above: 256,
                type: "keyword",
              },
              body_length: {
                type: "long",
              },
              header: {
                properties: {
                  accept: {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "accept-encoding": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "accept-language": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "cache-control": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  connection: {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "content-length": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "content-type": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  content_type: {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  cookie: {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  host: {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "if-none-match": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  pragma: {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  referer: {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "sec-fetch-dest": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "sec-fetch-mode": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "sec-fetch-site": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "sec-fetch-user": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "upgrade-insecure-requests": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "user-agent": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                },
              },
              host: {
                ignore_above: 256,
                type: "keyword",
              },
              local_addr: {
                ignore_above: 256,
                type: "keyword",
              },
              method: {
                ignore_above: 256,
                type: "keyword",
              },
              path: {
                ignore_above: 256,
                type: "keyword",
              },
              query_args: {
                type: "object",
              },
              remote_addr: {
                ignore_above: 256,
                type: "keyword",
              },
              started: {
                type: "date",
              },
              uri: {
                ignore_above: 256,
                type: "keyword",
              },
            },
          },
          response: {
            properties: {
              body: {
                ignore_above: 256,
                type: "keyword",
              },
              body_length: {
                type: "long",
              },
              cached: {
                type: "boolean",
              },
              elapsed: {
                type: "float",
              },
              header: {
                properties: {
                  "content-encoding": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "content-length": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "content-type": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  "infini-cache": {
                    ignore_above: 256,
                    type: "keyword",
                  },
                  server: {
                    ignore_above: 256,
                    type: "keyword",
                  },
                },
              },
              local_addr: {
                ignore_above: 256,
                type: "keyword",
              },
              remote_addr: {
                ignore_above: 256,
                type: "keyword",
              },
              status_code: {
                type: "long",
              },
            },
          },
          tls: {
            type: "boolean",
          },
        },
      },
    },
    mock_log: {
      mappings: {
        properties: {
          method: {
            type: "keyword",
          },
          msg: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          timestamp: {
            type: "date",
          },
        },
      },
    },
    mock_log1: {
      mappings: {
        properties: {
          method: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          msg: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          timestamp: {
            type: "long",
          },
        },
      },
    },
    reindex: {
      mappings: {
        properties: {
          created_at: {
            type: "date",
          },
          desc: {
            type: "text",
          },
          dest: {
            type: "object",
          },
          name: {
            type: "text",
          },
          source: {
            type: "object",
          },
          status: {
            type: "keyword",
          },
          task_id: {
            type: "keyword",
          },
        },
      },
    },
    "test-custom": {
      mappings: {
        properties: {
          address: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          age: {
            type: "long",
          },
          created_at: {
            type: "date",
          },
          email: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          hobbies: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          id: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          name: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
        },
      },
    },
    "test-custom1": {
      mappings: {
        properties: {
          address: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          created_at: {
            type: "date",
          },
          email: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          hobbies: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          id: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          name: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
        },
      },
    },
    "test-custom8": {
      mappings: {
        properties: {
          address: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          age: {
            type: "long",
          },
          created_at: {
            type: "date",
          },
          email: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          hobbies: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          id: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
          name: {
            fields: {
              keyword: {
                ignore_above: 256,
                type: "keyword",
              },
            },
            type: "text",
          },
        },
      },
    },
  },
  status: true,
};

export default {
  // 'get /_search-center/_cat/indices': function(req, res){
  //     res.send(data)
  // },
  // 'get /_search-center/index/:index/_mappings': function(req, res){
  //     res.send(mappings)
  // }

  "GET /elasticsearch/:cluster_id/_cat/indices": function(req, res) {
    res.send({
      ".apm-agent-configuration": {
        id: "DXT39lbQQFCY9p4_XTUTFQ",
        index: ".apm-agent-configuration",
        status: "open",
        health: "green",
        shards: 1,
        replicas: 1,
        store_size: "416b",
        pri_store_size: "208b",
      },
      ".apm-custom-link": {
        id: "bRw9BgQTQSyIxYqeCzf6jg",
        index: ".apm-custom-link",
        status: "open",
        health: "green",
        shards: 1,
        replicas: 1,
        store_size: "416b",
        pri_store_size: "208b",
      },
      ".kibana-event-log-7.9.3-000001": {
        id: "kjmVS-oTT2q7qEbYNY8nIQ",
        index: ".kibana-event-log-7.9.3-000001",
        status: "open",
        health: "green",
        shards: 1,
        replicas: 1,
        docs_count: 1,
        segments_count: 2,
        store_size: "11.1kb",
        pri_store_size: "5.5kb",
      },
      ".kibana_1": {
        id: "tDgyKEadQMGoTlVcEY2YPw",
        index: ".kibana_1",
        status: "open",
        health: "green",
        shards: 1,
        replicas: 1,
        docs_count: 14,
        segments_count: 12,
        store_size: "20.8mb",
        pri_store_size: "10.4mb",
      },
      ".kibana_task_manager_1": {
        id: "h_3tImGORHCplX3-UMvOpg",
        index: ".kibana_task_manager_1",
        status: "open",
        health: "green",
        shards: 1,
        replicas: 1,
        docs_count: 6,
        docs_deleted: 60,
        segments_count: 16,
        store_size: "197.3kb",
        pri_store_size: "109.9kb",
      },
      "filebeat-7.8.0-2022.03.08-000001": {
        id: "KWBOoelORmiJmkBce_MdXg",
        index: "filebeat-7.8.0-2022.03.08-000001",
        status: "open",
        health: "green",
        shards: 1,
        replicas: 1,
        docs_count: 21409646,
        segments_count: 63,
        store_size: "10gb",
        pri_store_size: "5gb",
      },
      "gateway_requests": {
        id: "vTVZSxwIR7qyYEYkw7Q90w",
        index: "gateway_requests",
        status: "open",
        health: "green",
        shards: 1,
        replicas: 1,
        docs_count: 206582,
        segments_count: 66,
        store_size: "9.5gb",
        pri_store_size: "5.4gb",
      },
    });
  },
};
