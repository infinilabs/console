const sourceItem = {
  id: "c97um9tath2fgbc3jbxx",
  created: "2022-06-14T10:58:31.318579+08:00",
  updated: "2022-06-14T10:58:31.318579+08:00",
  source: {
    cluster_id: "c97um9tath2fgbc3jbs1",
    cluster_name: "Cluster-A",
    indices: 10,
    documents: 12131344,
  },
  target: {
    cluster_id: "c97um9tath2fgbc3jbs2",
    cluster_name: "Cluster-B",
    migrated_indices: 3,
  },
  status: "started",
  creator: {
    name: "admin",
    id: "10000",
  },
};
const sourceItem2 = {
  id: "c97um9tath2fgbc3jbx2",
  created: "2022-06-14T10:58:31.318579+08:00",
  updated: "2022-06-14T10:58:31.318579+08:00",
  source: {
    cluster_id: "297um9tath2fgbc3jbs1",
    cluster_name: "Cluster-A2",
    indices: 10,
    documents: 52131344,
  },
  target: {
    cluster_id: "297um9tath2fgbc3jbs2",
    cluster_name: "Cluster-B2",
    migrated_indices: 0,
  },
  status: "not started",
  creator: {
    name: "admin",
    id: "10000",
  },
};
const sourceItem3 = {
  id: "c97um9tath2fgbc3jbx3",
  created: "2022-06-14T10:58:31.318579+08:00",
  updated: "2022-06-14T10:58:31.318579+08:00",
  source: {
    cluster_id: "397um9tath2fgbc3jbs1",
    cluster_name: "Cluster-A3",
    indices: 10,
    documents: 22131344,
  },
  target: {
    cluster_id: "397um9tath2fgbc3jbs2",
    cluster_name: "Cluster-B3",
    migrated_indices: 10,
  },
  status: "done",
  creator: {
    name: "admin",
    id: "10000",
  },
};

export default {
  "POST /migration/data": function(req, res) {
    res.send({
      result: "created",
    });
  },
  "GET /migration/data/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: 1,
        },
        max_score: 1.540445,
        hits: [
          {
            _index: ".infini_task",
            _type: "_doc",
            _id: "cd212gdath2d3d1sa9q0",
            _source: {
              cancellable: true,
              created: "2022-10-10T20:34:09.806766+08:00",
              id: "cd212gdath2d3d1sa9q0",
              metadata: {
                labels: {
                  pipeline_id: "cluster_migration",
                  source_cluster_id: "c8i18q5ath2blrusdjpg",
                  source_total_docs: 53000,
                  target_cluster_id: "c8i18q5ath2blrusdjpg",
                  target_total_docs: 44418,
                },
                type: "pipeline",
              },
              parameters: {
                pipeline: {
                  config: {
                    cluster: {
                      source: {
                        id: "c8i18q5ath2blrusdjpg",
                        name: "es-v7140",
                      },
                      target: {
                        id: "c8i18q5ath2blrusdjpg",
                        name: "es-v7140",
                      },
                    },
                    creator: {
                      id: "",
                      name: "admin",
                    },
                    indices: [
                      {
                        id: "cd212jlath2d3d1sa9rg",
                        index_rename: null,
                        partition: {
                          field_name: "now_with_format",
                          field_type: "date",
                          step: "60s",
                        },
                        raw_filter: {
                          range: {
                            now_with_format: {
                              gte: "2022-09-22T11:01:22.000Z",
                              lte: "2022-09-22T11:05:22.000Z",
                            },
                          },
                        },
                        source: {
                          docs: 18250298,
                          name: "test",
                          store_size_in_bytes: 1170482,
                        },
                        target: {
                          docs: 0,
                          name: "test-bakx",
                          store_size_in_bytes: 1170482,
                        },
                        type_rename: null,
                      },
                    ],
                    settings: {
                      bulk_size: {
                        documents: 1000,
                        store_size_in_mb: 20,
                      },
                      exec_interval: [
                        {
                          end: "06:30",
                          start: "01:00",
                        },
                      ],
                      parallel_indices: 1,
                      parallel_task_per_index: 2,
                      scroll_size: {
                        documents: 1000,
                        timeout: "5m",
                      },
                    },
                  },
                  id: "cluster_migration",
                },
              },
              runnable: false,
              start_time_in_millis: 1665405261938,
              status: "running",
              updated: "2022-10-10T20:34:20.898065+08:00",
            },
          },
        ],
      },
    });
  },
  "GET /migration/data/:id": function(req, res) {
    res.send({
      found: true,
      _id: "c97um9tath2fgbc3jbxx",
      _source: sourceItem,
    });
  },

  "PUT /migration/data/:id": function(req, res) {
    sourceItem.updated = new Date();
    res.send({
      _id: "c97um9tath2fgbc3jbxx",
      _source: migration,
      result: "updated",
    });
  },
  "DELETE /migration/data/:id": function(req, res) {
    //移除对应任务
    res.send({
      result: "deleted",
    });
  },
  //{"status": "start|stop|pause"}
  "POST /migration/data/:id/_status": function(req, res) {
    //关闭开启任务
    res.send({
      result: "updated",
    });
  },

  /*
  {
    "filter": {
      "range": {
          "now_with_format": {
              "gte": "2022-09-22T11:03:22.000Z",
              "lte": "2022-09-22T11:05:22.000Z"
          }
       }     
    }
  }

  or
  //带type条件
  {
    "filter":{
    "bool": {
      "must": [
        {
          "range": {
            "now_with_format": {
              "gte": "2022-09-22T11:03:22.000Z",
              "lte": "2022-09-22T11:05:22.000Z"
            }
          }
        }
        ,
        {
          "term": {
            "_type": {
              "value": "VALUE"
            }
          }
        }
      ]
    }
  }
  }
*/
  "POST /elasticsearch/:id/index/:index/_count": function(req, res) {
    //统计索引文档数
    res.send({
      count: 17920298,
    });
  },

  /*
  URL:/migration/data/_validate?type=multi_type
  {
    "cluster": {
        "source_id": "c0oc4kkgq9s8qss2uk50",
        "target_id": "c8i18llath2blrusdjng"
    },
    "indices": ["test", "index", "mall-2022"]
  }
  */
  "POST /migration/data/_validate": function(req, res) {
    //迁移任务校验：集群低版本多type校验
    let result = {};
    if (req.body.cluster.source_id == "c0oc4kkgq9s8qss2uk50") {
      result = {
        result: {
          index: {
            doc1: 1,
            doc2: 1,
          },
          "mall-2022": {
            doc: 3,
          },
          test: {
            type1: 11,
            type2: 12,
          },
          "my-blog": {
            doc: 3,
          },
        },
      };
    }

    if (req.body.cluster.source_id == "c0oc4kkgq9s8qss2uk51") {
      result = {
        result: {
          test: {
            type1: 61,
            type2: 72,
          },
          "my-blog": {
            doc: 53,
          },
        },
      };
    }
    res.send(result);
  },
};
