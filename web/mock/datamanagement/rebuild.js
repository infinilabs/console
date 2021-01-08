let data = {
  "payload": {
    "took": 0,
    "timed_out": false,
    "hits": {
      "total": {
        "relation": "eq",
        "value": 7
      },
      "max_score": 0,
      "hits": [
        {
          "_index": "infinireindex",
          "_type": "_doc",
          "_id": "bvrdoldath27go6rq64g",
          "_source": {
            "created_at": "2021-01-07T18:03:01.769901+08:00",
            "desc": "",
            "dest": {
              "index": "infini-test8",
              "pipeline": ""
            },
            "id": "bvrdoldath27go6rq64g",
            "name": "test ddd",
            "source": {
              "_source": [],
              "index": "infini-test",
              "query": null
            },
            "status": "SUCCEED",
            "task_id": "F0D6OfeVSzuMhf5528ANTw:1050387",
            "task_source": {
              "completed": true,
              "response": {
                "batches": 1,
                "created": 0,
                "deleted": 0,
                "failures": [],
                "noops": 0,
                "requests_per_second": -1,
                "retries": {
                  "bulk": 0,
                  "search": 0
                },
                "throttled": "0s",
                "throttled_millis": 0,
                "throttled_until": "0s",
                "throttled_until_millis": 0,
                "timed_out": false,
                "took": 79,
                "total": 11,
                "updated": 11,
                "version_conflicts": 0
              },
              "task": {
                "action": "indices:data/write/reindex",
                "cancellable": true,
                "description": "reindex from [infini-test] to [infini-test8][_doc]",
                "headers": {},
                "id": 1050387,
                "node": "F0D6OfeVSzuMhf5528ANTw",
                "running_time_in_nanos": 79494026,
                "start_time_in_millis": 1610013781769,
                "status": {
                  "batches": 1,
                  "created": 0,
                  "deleted": 0,
                  "noops": 0,
                  "requests_per_second": -1,
                  "retries": {
                    "bulk": 0,
                    "search": 0
                  },
                  "throttled_millis": 0,
                  "throttled_until_millis": 0,
                  "total": 11,
                  "updated": 11,
                  "version_conflicts": 0
                },
                "type": "transport"
              }
            }
          }
        },
        {
          "_index": "infinireindex",
          "_type": "_doc",
          "_id": "bvqmpstath24tgfo107g",
          "_source": {
            "created_at": "2021-01-06T15:55:31.426604+08:00",
            "desc": "test source index not exists",
            "dest": {
              "index": "infini-test8",
              "pipeline": ""
            },
            "id": "bvqmpstath24tgfo107g",
            "name": "test failed",
            "source": {
              "_source": [],
              "index": "infini-testx",
              "query": null
            },
            "status": "FAILED",
            "task_id": "F0D6OfeVSzuMhf5528ANTw:824925",
            "task_source": {
              "completed": true,
              "error": {
                "index": "infini-testx",
                "index_uuid": "_na_",
                "reason": "no such index [infini-testx]",
                "resource.id": "infini-testx",
                "resource.type": "index_or_alias",
                "type": "index_not_found_exception"
              },
              "task": {
                "action": "indices:data/write/reindex",
                "cancellable": true,
                "description": "reindex from [infini-testx] to [infini-test8][_doc]",
                "headers": {},
                "id": 824925,
                "node": "F0D6OfeVSzuMhf5528ANTw",
                "running_time_in_nanos": 172714,
                "start_time_in_millis": 1609919731425,
                "status": {
                  "batches": 0,
                  "created": 0,
                  "deleted": 0,
                  "noops": 0,
                  "requests_per_second": 0,
                  "retries": {
                    "bulk": 0,
                    "search": 0
                  },
                  "throttled_millis": 0,
                  "throttled_until_millis": 0,
                  "total": 0,
                  "updated": 0,
                  "version_conflicts": 0
                },
                "type": "transport"
              }
            }
          }
        },
        {
          "_index": "infinireindex",
          "_type": "_doc",
          "_id": "bvqmmnlath24tgfo1070",
          "_source": {
            "created_at": "2021-01-06T15:48:46.585112+08:00",
            "desc": "test query param again",
            "dest": {
              "index": "infini-test8",
              "pipeline": ""
            },
            "id": "bvqmmnlath24tgfo1070",
            "name": "test query one",
            "source": {
              "_source": [],
              "index": "infini-test",
              "query": {
                "match": {
                  "name": "cincky"
                }
              }
            },
            "status": "SUCCEED",
            "task_id": "F0D6OfeVSzuMhf5528ANTw:822567",
            "task_source": {
              "completed": true,
              "response": {
                "batches": 1,
                "created": 0,
                "deleted": 0,
                "failures": [],
                "noops": 0,
                "requests_per_second": -1,
                "retries": {
                  "bulk": 0,
                  "search": 0
                },
                "throttled": "0s",
                "throttled_millis": 0,
                "throttled_until": "0s",
                "throttled_until_millis": 0,
                "timed_out": false,
                "took": 44,
                "total": 1,
                "updated": 1,
                "version_conflicts": 0
              },
              "task": {
                "action": "indices:data/write/reindex",
                "cancellable": true,
                "description": "reindex from [infini-test] to [infini-test8][_doc]",
                "headers": {},
                "id": 822567,
                "node": "F0D6OfeVSzuMhf5528ANTw",
                "running_time_in_nanos": 44277146,
                "start_time_in_millis": 1609919326584,
                "status": {
                  "batches": 1,
                  "created": 0,
                  "deleted": 0,
                  "noops": 0,
                  "requests_per_second": -1,
                  "retries": {
                    "bulk": 0,
                    "search": 0
                  },
                  "throttled_millis": 0,
                  "throttled_until_millis": 0,
                  "total": 1,
                  "updated": 1,
                  "version_conflicts": 0
                },
                "type": "transport"
              }
            }
          }
        },
        {
          "_index": "infinireindex",
          "_type": "_doc",
          "_id": "bvqmlf5ath24tgfo106g",
          "_source": {
            "created_at": "2021-01-06T15:46:04.745132+08:00",
            "desc": "test query param",
            "dest": {
              "index": "infini-test8",
              "pipeline": ""
            },
            "id": "bvqmlf5ath24tgfo106g",
            "name": "test query",
            "source": {
              "_source": [],
              "index": "infini-test1",
              "query": {
                "match": {
                  "name": "test"
                }
              }
            },
            "status": "SUCCEED",
            "task_id": "F0D6OfeVSzuMhf5528ANTw:821548",
            "task_source": {
              "completed": true,
              "response": {
                "batches": 0,
                "created": 0,
                "deleted": 0,
                "failures": [],
                "noops": 0,
                "requests_per_second": -1,
                "retries": {
                  "bulk": 0,
                  "search": 0
                },
                "throttled": "0s",
                "throttled_millis": 0,
                "throttled_until": "0s",
                "throttled_until_millis": 0,
                "timed_out": false,
                "took": 0,
                "total": 0,
                "updated": 0,
                "version_conflicts": 0
              },
              "task": {
                "action": "indices:data/write/reindex",
                "cancellable": true,
                "description": "reindex from [infini-test1] to [infini-test8][_doc]",
                "headers": {},
                "id": 821548,
                "node": "F0D6OfeVSzuMhf5528ANTw",
                "running_time_in_nanos": 982379,
                "start_time_in_millis": 1609919164744,
                "status": {
                  "batches": 0,
                  "created": 0,
                  "deleted": 0,
                  "noops": 0,
                  "requests_per_second": -1,
                  "retries": {
                    "bulk": 0,
                    "search": 0
                  },
                  "throttled_millis": 0,
                  "throttled_until_millis": 0,
                  "total": 0,
                  "updated": 0,
                  "version_conflicts": 0
                },
                "type": "transport"
              }
            }
          }
        },
        {
          "_index": "infinireindex",
          "_type": "_doc",
          "_id": "bvqmkilath24tgfo1060",
          "_source": {
            "created_at": "2021-01-06T15:44:10.535851+08:00",
            "desc": "test source param",
            "dest": {
              "index": "infini-test8",
              "pipeline": ""
            },
            "id": "bvqmkilath24tgfo1060",
            "name": "test source",
            "source": {
              "_source": [
                "email",
                "hobbies",
                "created_at",
                "name"
              ],
              "index": "infini-test1",
              "query": null
            },
            "status": "SUCCEED",
            "task_id": "F0D6OfeVSzuMhf5528ANTw:820833",
            "task_source": {
              "completed": true,
              "response": {
                "batches": 1,
                "created": 0,
                "deleted": 0,
                "failures": [],
                "noops": 0,
                "requests_per_second": -1,
                "retries": {
                  "bulk": 0,
                  "search": 0
                },
                "throttled": "0s",
                "throttled_millis": 0,
                "throttled_until": "0s",
                "throttled_until_millis": 0,
                "timed_out": false,
                "took": 53,
                "total": 4,
                "updated": 4,
                "version_conflicts": 0
              },
              "task": {
                "action": "indices:data/write/reindex",
                "cancellable": true,
                "description": "reindex from [infini-test1] to [infini-test8][_doc]",
                "headers": {},
                "id": 820833,
                "node": "F0D6OfeVSzuMhf5528ANTw",
                "running_time_in_nanos": 53101238,
                "start_time_in_millis": 1609919050535,
                "status": {
                  "batches": 1,
                  "created": 0,
                  "deleted": 0,
                  "noops": 0,
                  "requests_per_second": -1,
                  "retries": {
                    "bulk": 0,
                    "search": 0
                  },
                  "throttled_millis": 0,
                  "throttled_until_millis": 0,
                  "total": 4,
                  "updated": 4,
                  "version_conflicts": 0
                },
                "type": "transport"
              }
            }
          }
        },
        {
          "_index": "infinireindex",
          "_type": "_doc",
          "_id": "bvqmj55ath24tgfo105g",
          "_source": {
            "created_at": "2021-01-06T15:41:08.159721+08:00",
            "desc": "test pipeline param",
            "dest": {
              "index": "infini-test8",
              "pipeline": "test"
            },
            "id": "bvqmj55ath24tgfo105g",
            "name": "test pipeline",
            "source": {
              "_source": [],
              "index": "infini-test1",
              "query": null
            },
            "status": "SUCCEED",
            "task_id": "F0D6OfeVSzuMhf5528ANTw:819744",
            "task_source": {
              "completed": true,
              "response": {
                "batches": 1,
                "created": 0,
                "deleted": 0,
                "failures": [],
                "noops": 0,
                "requests_per_second": -1,
                "retries": {
                  "bulk": 0,
                  "search": 0
                },
                "throttled": "0s",
                "throttled_millis": 0,
                "throttled_until": "0s",
                "throttled_until_millis": 0,
                "timed_out": false,
                "took": 251,
                "total": 4,
                "updated": 4,
                "version_conflicts": 0
              },
              "task": {
                "action": "indices:data/write/reindex",
                "cancellable": true,
                "description": "reindex from [infini-test1] to [infini-test8][_doc]",
                "headers": {},
                "id": 819744,
                "node": "F0D6OfeVSzuMhf5528ANTw",
                "running_time_in_nanos": 251872120,
                "start_time_in_millis": 1609918868159,
                "status": {
                  "batches": 1,
                  "created": 0,
                  "deleted": 0,
                  "noops": 0,
                  "requests_per_second": -1,
                  "retries": {
                    "bulk": 0,
                    "search": 0
                  },
                  "throttled_millis": 0,
                  "throttled_until_millis": 0,
                  "total": 4,
                  "updated": 4,
                  "version_conflicts": 0
                },
                "type": "transport"
              }
            }
          }
        },
        {
          "_index": "infinireindex",
          "_type": "_doc",
          "_id": "bvq89p5ath243f63hngg",
          "_source": {
            "created_at": "2021-01-05T23:25:24.751473+08:00",
            "desc": "test new rebuild api",
            "dest": {
              "index": "infini-test8",
              "pipeline": ""
            },
            "id": "bvq89p5ath243f63hngg",
            "name": "test new rebuild api",
            "source": {
              "_source": [],
              "index": "infini-test",
              "query": null
            },
            "status": "SUCCEED",
            "task_id": "F0D6OfeVSzuMhf5528ANTw:707730",
            "task_source": {
              "completed": true,
              "response": {
                "batches": 1,
                "created": 11,
                "deleted": 0,
                "failures": [],
                "noops": 0,
                "requests_per_second": -1,
                "retries": {
                  "bulk": 0,
                  "search": 0
                },
                "throttled": "0s",
                "throttled_millis": 0,
                "throttled_until": "0s",
                "throttled_until_millis": 0,
                "timed_out": false,
                "took": 117,
                "total": 11,
                "updated": 0,
                "version_conflicts": 0
              },
              "task": {
                "action": "indices:data/write/reindex",
                "cancellable": true,
                "description": "reindex from [infini-test] to [infini-test8][_doc]",
                "headers": {},
                "id": 707730,
                "node": "F0D6OfeVSzuMhf5528ANTw",
                "running_time_in_nanos": 118081190,
                "start_time_in_millis": 1609860324750,
                "status": {
                  "batches": 1,
                  "created": 11,
                  "deleted": 0,
                  "noops": 0,
                  "requests_per_second": -1,
                  "retries": {
                    "bulk": 0,
                    "search": 0
                  },
                  "throttled_millis": 0,
                  "throttled_until_millis": 0,
                  "total": 11,
                  "updated": 0,
                  "version_conflicts": 0
                },
                "type": "transport"
              }
            }
          }
        }
      ]
    }
  },
  "status": true
};

export default {
  'get /_search-center/rebuild/_search': function(req, res){
    res.send(data)
  }
}