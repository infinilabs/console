export default {
    // 'POST /elasticsearch/:id/_proxy': function(req, res){
    //     res.set('content-type', 'content-type: text/plain; charset=UTF-8');
    //     res.send('.security               .security-7                    - - - -\n' +
    //         'ilm-history-2           ilm-history-2-000002           - - - true\n' +
    //         '.kibana-event-log-7.9.2 .kibana-event-log-7.9.2-000002 - - - true\n' +
    //         '.kibana_task_manager    .kibana_task_manager_1         - - - -\n' +
    //         '.kibana                 .kibana_1                      - - - -\n' +
    //         '.kibana-event-log-7.9.2 .kibana-event-log-7.9.2-000001 - - - false\n' +
    //         'ilm-history-2           ilm-history-2-000001           - - - false');
    // },

    // curl -XPOST  http://localhost:8000/elasticsearch/uuid/_proxy\?path=%2F_search&method=GET?pretty -d '{ "size": 1 }'
    'POST /elasticsearch/:id/_proxy': function(req, res){
        res.send({
                "took" : 1055,
                "timed_out" : false,
                "_shards" : {
                    "total" : 37,
                    "successful" : 37,
                    "skipped" : 0,
                    "failed" : 0
                },
                "hits" : {
                    "total" : {
                        "value" : 10000,
                        "relation" : "gte"
                    },
                    "max_score" : 1.0,
                    "hits" : [
                        {
                            "_index" : ".kibana-event-log-7.9.2-000001",
                            "_type" : "_doc",
                            "_id" : "VLvqYncBwyX1iJ4H4cBA",
                            "_score" : 1.0,
                            "_source" : {
                                "event" : {
                                    "provider" : "eventLog",
                                    "action" : "starting"
                                },
                                "message" : "eventLog starting",
                                "@timestamp" : "2021-02-02T13:23:16.799Z",
                                "ecs" : {
                                    "version" : "1.5.0"
                                },
                                "kibana" : {
                                    "server_uuid" : "d9f160b3-97c4-4aa9-928f-209d481b6e83"
                                }
                            }
                        }
                    ]
                }
            }
        );
    },

    //查看 proxy 请求历史记录
    'GET /elasticsearch/:id/proxy_history/_search': function(req, res){
        res.send({
                "took" : 1055,
                "timed_out" : false,
                "_shards" : {
                    "total" : 37,
                    "successful" : 37,
                    "skipped" : 0,
                    "failed" : 0
                },
                "hits" : {
                    "total" : {
                        "value" : 10000,
                        "relation" : "gte"
                    },
                    "max_score" : 1.0,
                    "hits" : [
                        {
                            "_index" : "gateway-command-history-7.9.2-000001",
                            "_type" : "_doc",
                            "_id" : "VLvqYncBwyX1iJ4H4cBA",
                            "_score" : 1.0,
                            "_source" : {
                                "created" : "2021-02-02T13:23:16.799Z",
                                "request" : {
                                },
                                "status":200,
                                "user":{
                                    "username":"medcl",
                                    "group":["superuser"]
                                }
                            }
                        }
                    ]
                }
            }
        );
    },

    //新增/修改常用命令, id 可选
    //curl -XPOST /elasticsearch/:id/command/:id -d'
    // {
    //     "request" : {
    //          "method" : "POST",
    //         "path" : "/myindex/_search",
    //         "body" : "{ \"query\": { \"match\": { \"name\": \"medcl\" } } }"
    // },
    //     "title":"一个常用查询的例子",
    //     "tag":["example","search"],
    //     "user":{
    //         "username":"medcl",
    //         "group":["superuser"]
    // }
    // }'
    'POST /elasticsearch/:id/command/[:id]': function(req, res){
        res.send({
            "_id": "c0oc4kkgq9s8qss2uk50",
            "_source": {
                "created" : "2021-02-02T13:23:16.799Z",
                "request" : {
                    "method" : "POST",
                    "path" : "/myindex/_search",
                    "body" : "{ \"query\": { \"match\": { \"name\": \"medcl\" } } }"
                },
                "title":"一个常用查询的例子",
                "tag":["example","search"],
                "user":{
                    "username":"medcl",
                    "group":["superuser"]
                }
            },
            "result": "created"
        });
    },

    //加载常用命令
    'GET /elasticsearch/:id/command/:id': function(req, res){
        res.send({
            "_id": "c0oc4kkgq9s8qss2uk50",
            "_source": {
                "created" : "2021-02-02T13:23:16.799Z",
                "request" : {
                    "method" : "POST",
                    "path" : "/myindex/_search",
                    "body" : "{ \"query\": { \"match\": { \"name\": \"medcl\" } } }"
                },
                "status":200,
                "title":"一个常用查询的例子",
                "tag":["example","search"],
                "user":{
                    "username":"medcl",
                    "group":["superuser"]
                }
            },
            "found": true
        });
    },

    //删除常用命令
    'DELETE /elasticsearch/:id/command/:command_id': function(req, res){
        res.send({
                "_id": "c0oc4kkgq9s8qss2uk50",
                "result": "deleted"
            });
    },


    //搜索常用命令
    'GET /elasticsearch/:id/command/_search': function(req, res){
        res.send({
                "took" : 1055,
                "timed_out" : false,
                "_shards" : {
                    "total" : 37,
                    "successful" : 37,
                    "skipped" : 0,
                    "failed" : 0
                },
                "hits" : {
                    "total" : {
                        "value" : 10000,
                        "relation" : "gte"
                    },
                    "max_score" : 1.0,
                    "hits" : [
                        {
                            "_index" : "gateway-command-7.9.2-000001",
                            "_type" : "_doc",
                            "_id" : "VLvqYncBwyX1iJ4H4cBA",
                            "_score" : 1.0,
                            "_source" : {
                                "created" : "2021-02-02T13:23:16.799Z",
                                "request" : {
                                    "method" : "POST",
                                    "path" : "/myindex/_search",
                                    "body" : "{ \"query\": { \"match\": { \"name\": \"medcl\" } } }"
                                },
                                "title":"一个常用查询的例子",
                                "tag":["example","search"],
                                "user":{
                                    "username":"medcl",
                                    "group":["superuser"]
                                }
                            }
                        }
                    ]
                }
            }
        );
    },


}
