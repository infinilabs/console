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

}
