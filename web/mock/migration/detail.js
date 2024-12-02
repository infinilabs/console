export default {
  "GET /migration/data/:task_id/info": function(req, res) {
    res.send({
      id: "nzGteYMBQQ2yr1vgmpHU",
      parent_id: [],
      metadata: {
        type: "pipeline",
        labels: {
          pipeline_id: "cluster_migration",
          completed_indices: 22,
          log_info: {
            cluster_id: "test_cluster",
            index_name: "test_index",
          },
        },
      },
      start_time_in_millis: 1664272016966,
      cancellable: false,
      runnable: true,
      parameters: {
        pipeline: {
          id: "cluster_migration",
          config: {
            cluster: {
              source: {
                id: "c8i18llath2blrusdjng",
                name: "elasticsearch",
              },
              target: {
                id: "c8in3llath2dpdt4md7g",
                name: "es-v710",
              },
            },
            indices: [
              {
                source: {
                  name: "gateway_requests",
                  docs: 164,
                  store_size_in_bytes: 1170482,
                },
                target: {
                  name: "gateway_new",
                  docs: 164,
                  store_size_in_bytes: 1170482,
                },
                raw_filter: "request.method.keyword:GET",
                partition: {
                  field_type: "date",
                  field_name: "xxx",
                  step: 500,
                },
                //init, ready, running,complete,error, stopped
                status: "complete",
                percent: 100,
                error_partitions: 1,
                task_id: "1",
              },
              {
                source: {
                  name: "source_index1",
                  docs: 164,
                  store_size_in_bytes: 1170482,
                },
                target: {
                  name: "target_index1",
                  docs: 164,
                  store_size_in_bytes: 1170482,
                },
                raw_filter: "request.method.keyword:GET",
                partition: {
                  field_type: "date",
                  field_name: "xxx",
                  step: 500,
                },
                status: "error",
                percent: 70,
                error_partitions: 1,
                task_id: "2",
              },
              {
                source: {
                  name: "source_index2",
                  docs: 164,
                  store_size_in_bytes: 1170482,
                },
                target: {
                  name: "target_index2",
                  docs: 164,
                  store_size_in_bytes: 1170482,
                },
                raw_filter: "request.method.keyword:GET",
                partition: {
                  field_type: "date",
                  field_name: "xxx",
                  step: 500,
                },
                status: "running",
                percent: 80,
                task_id: "3",
              },
              {
                source: {
                  name: "source_index3",
                  docs: 164,
                  store_size_in_bytes: 1170482,
                },
                target: {
                  name: "target_index3",
                  docs: 164,
                  store_size_in_bytes: 1170482,
                },
                raw_filter: "request.method.keyword:GET",
                partition: {
                  field_type: "date",
                  field_name: "xxx",
                  step: 500,
                },
                status: "init",
                percent: 80,
                task_id: "4",
              },
              {
                source: {
                  name: "source_index4",
                  docs: 164,
                  store_size_in_bytes: 1170482,
                },
                target: {
                  name: "target_index4",
                  docs: 164,
                  store_size_in_bytes: 1170482,
                },
                raw_filter: "request.method.keyword:GET",
                partition: {
                  field_type: "date",
                  field_name: "xxx",
                  step: 500,
                },
                status: "stopped",
                percent: 0,
                task_id: "5",
              },
            ],
            settings: {
              parallel_indices: 1,
              parallel_task_per_index: 2,
              scroll_size: {
                documents: 1000,
                timeout: "5m",
              },
              bulk_size: {
                documents: 1000,
                store_size_in_bytes: 10240,
              },
              execution: {
                time_window: [
                  {
                    start: "01:00",
                    end: "06:30",
                  },
                ],
                nodes: {
                  permit: [
                    {
                      id: "cc65r0dath255p20jqo0",
                      name: "Dynamo",
                    },
                  ],
                },
              },
            },
            creator: {
              name: "admin",
              id: "admin",
            },
          },
        },
      },
    });
  },

  "PUT /migration/migration/:id/info": function(req, res) {
    res.send({
      result: "updated",
    });
  },

  // get log
  "GET /migration/migration/:id/log": function(req, res) {
    res.send({
      has_more: false,
      lines: [
        {
          bytes: 347,
          content:
            '{"type": "deprecation", "timestamp": "2022-08-09T17:50:36,778+0800", "level": "WARN", "component": "o.e.d.b.Bootstrap", "cluster.name": "elasticsearch", "node.name": "es-root",  "message": "future versions of Elasticsearch will require Java 11; your Java version from [C:\\\\Program Files\\\\Java\\\\jdk1.8.0_333\\\\jre] does not meet this requirement"  }',
          line_number: 1,
          offset: 349,
        },
        {
          bytes: 363,
          content:
            '{"type": "deprecation", "timestamp": "2022-08-09T17:50:37,233+0800", "level": "WARN", "component": "o.e.d.c.s.Settings", "cluster.name": "elasticsearch", "node.name": "es-root",  "message": "[transport.tcp.port] setting was deprecated in Elasticsearch and will be removed in a future release! See the breaking changes documentation for the next major version."  }',
          line_number: 2,
          offset: 714,
        },
      ],
    });
  },

  // get exec node list
  "GET /_platform/nodes": function(req, res) {
    //queryString:keyword=xxx
    res.send([
      {
        id: "cd33sllath21e53utoe0",
        name: "Iceman",
        type: "agent",
        host: "192.168.3.6:8001",
        available: false,
      },
      {
        id: "cc65r0dath255p20jqo0",
        name: "Thing",
        type: "gateway",
        host: "192.168.3.6:2900",
        available: true,
      },
      {
        id: "cd21lm1u46ll46iq7o5g",
        name: "Prism",
        type: "gateway",
        host: "192.168.3.4:2900",
        available: true,
      },
    ]);
  },

  // get migration indices info
  "GET /migration/data/:task_id/info/index": function(req, res) {
    const partitions = [];
    for (let i = 0; i < 88; i++) {
      if (i === 0) {
        partitions.push({
          task_id: `${i}`,
          status: "error",
          start: "1",
          end: "5000",
          duration: 66000,
          total_docs: 100,
          scroll_docs: 100,
          index_docs: 50,
        });
      } else if (i < 55) {
        partitions.push({
          task_id: `${i}`,
          status: "complete",
          start: "1",
          end: "5000",
          duration: 66000,
          total_docs: 100,
          scroll_docs: 100,
          index_docs: 50,
        });
      } else if (i < 66) {
        partitions.push({
          task_id: `${i}`,
          status: "scroll_complete",
          start: "1",
          end: "5000",
          duration: 66000,
          total_docs: 100,
          scroll_docs: 100,
          index_docs: 50,
        });
      } else if (i < 77) {
        partitions.push({
          task_id: `${i}`,
          status: "running",
          start: "1",
          end: "5000",
          duration: 66000,
          total_docs: 100,
          scroll_docs: 100,
          index_docs: 50,
        });
      } else {
        partitions.push({
          task_id: `${i}`,
          status: "init",
          start: "1",
          end: "5000",
          duration: 66000,
          total_docs: 100,
          scroll_docs: 100,
          index_docs: 50,
        });
      }
    }
    res.send({
      task_id: "123",
      start_time: 1665655488000,
      completed_time: 1665655488000,
      duration: 66000,
      data_partition: 66,
      step: 5000,
      partitions,
    });
  },

  "POST /elasticsearch/:id/index/:index/_partition": function(req, res) {
    res.send([
      {
        start: 1663844482000,
        end: 1663844542000,
        filter: {
          bool: {
            must: [
              {
                range: {
                  now_with_format: {
                    gte: 1663844482000,
                    lt: 1663844542000,
                  },
                },
              },
            ],
          },
        },
        docs: 10000,
        other: false,
      },
      {
        start: 1663844542000,
        end: 1663844602000,
        filter: {
          bool: {
            must: [
              {
                range: {
                  now_with_format: {
                    gte: 1663844542000,
                    lt: 1663844602000,
                  },
                },
              },
            ],
          },
        },
        docs: 320000,
        other: false,
      },
      {
        start: 1663844602000,
        end: 1663844662000,
        filter: {
          bool: {
            must: [
              {
                range: {
                  now_with_format: {
                    gte: 1663844602000,
                    lt: 1663844662000,
                  },
                },
              },
            ],
          },
        },
        docs: 6839678,
        other: false,
      },
      {
        start: 0,
        end: 0,
        filter: {
          bool: {
            must_not: [
              {
                exists: {
                  field: "now_with_format",
                },
              },
            ],
          },
        },
        docs: 32777,
        other: true,
      },
    ]);
  },

  "GET /cluster/:id/indices": function(req, res) {
    res.send([
      {
        id: "90kSevfnTcOLzNRuhpKMU1",
        index: "my-blog",
        status: "open",
        health: "yellow",
        shards: 1,
        replicas: 1,
        docs_count: 176000,
        docs_deleted: 42,
        segments_count: 8,
        store_size: "10102.3kb",
        pri_store_size: "10102.3kb",
      },
      {
        id: "QTE2OAKFT1GbZRqbyKLXlw",
        index: ".infini_view",
        status: "open",
        health: "yellow",
        shards: 1,
        replicas: 1,
        store_size: "208b",
        pri_store_size: "208b",
      },
    ]);
  },
};
