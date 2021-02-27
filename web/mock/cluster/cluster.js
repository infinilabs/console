export default {
  'GET /elasticsearch/_search': function(req, res){
    res.send({
      "took": 0,
      "timed_out": false,
      "hits": {
        "total": {
          "relation": "eq",
          "value": 1
        },
        "max_score": 1,
        "hits": [
          {
            "_index": ".infini-search-center_cluster",
            "_type": "_doc",
            "_id": "c0oc4kkgq9s8qss2uk50",
            "_source": {
              "basic_auth": {
                "password": "123",
                "username": "medcl"
              },
              "created": "2021-02-20T16:03:30.867084+08:00",
              "description": "xx业务集群1",
              "enabled": false,
              "endpoint": "http://localhost:9200",
              "name": "cluster1",
              "updated": "2021-02-20T16:03:30.867084+08:00"
            }
          },
          {
            "_index": ".infini-search-center_cluster",
            "_type": "_doc",
            "_id": "c0oc4kkgq9s8qss2uk51",
            "_source": {
              "basic_auth": {
                "password": "123",
                "username": "medcl"
              },
              "created": "2021-02-20T16:03:30.867084+08:00",
              "description": "xx业务集群2",
              "enabled": false,
              "endpoint": "http://localhost:9201",
              "name": "cluster2",
              "updated": "2021-02-20T16:03:30.867084+08:00"
            }
          }
        ]
      }
    })
  },
  'POST /elasticsearch/_search': function(req, res){
    res.send({
      "took": 0,
      "timed_out": false,
      "hits": {
        "total": {
          "relation": "eq",
          "value": 1
        },
        "max_score": 1,
        "hits": [
          {
            "_index": ".infini-search-center_cluster",
            "_type": "_doc",
            "_id": "c0oc4kkgq9s8qss2uk50",
            "_source": {
              "basic_auth": {
                "password": "123",
                "username": "medcl"
              },
              "created": "2021-02-20T16:03:30.867084+08:00",
              "description": "xx业务集群1",
              "enabled": false,
              "endpoint": "http://localhost:9200",
              "name": "cluster1",
              "updated": "2021-02-20T16:03:30.867084+08:00"
            }
          }
        ]
      }
    })
  },
  'POST /elasticsearch': function(req, res){
    res.send({
      "_id": "c0oc4kkgq9s8qss2uk50",
      "_source": {
        "name": "cluster1",
        "endpoint": "http://localhost:9200",
        "basic_auth": {
          "username": "medcl",
          "password": "123"
        },
        "description": "xx业务集群1",
        "enabled": false,
        "created": "2021-02-20T15:12:50.984062+08:00",
        "updated": "2021-02-20T15:12:50.984062+08:00"
      },
      "result": "created"
    });
  },
  'PUT /elasticsearch/:id': function(req, res){
    res.send({
      "_id": "c0oc4kkgq9s8qss2uk50",
      "_source": {
        "basic_auth": {
          "password": "456",
          "username": "medcl"
        },
        "description": "xx业务集群2",
        "endpoint": "http://localhost:9201",
        "name": "cluster2",
        "enabled": true,
        "updated": "2021-02-20T15:25:12.159789+08:00"
      },
      "result": "updated"
    });
  },
  'DELETE /elasticsearch/:id': function(req, res){
    res.send({
      "_id": "c0oc4kkgq9s8qss2uk50",
      "result": "deleted"
    });
  }
}
