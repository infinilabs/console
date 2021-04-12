export default {
  'GET /elasticsearch/:id/search_template/_search': function(req, res){
    res.send({
      "took": 0,
      "timed_out": false,
      "hits": {
        "total": {
          "relation": "eq",
          "value": 1
        },
        "max_score": 0.2876821,
        "hits": [
          {
            "_index": ".infini-search-center_searchtemplate",
            "_type": "_doc",
            "_id": "c1nc0dkagrh0jobkn6s0",
            "_source": {
              "created": "2021-04-08T15:54:06.675249+08:00",
              "name": "test_search_template",
              "source": "{\"query\":{\"match\":{\"{{my_field}}\":\"{{my_value}}\"}},\"size\":\"{{my_size}}\"}",
              "updated": "2021-04-08T15:54:06.675249+08:00"
            }
          }
        ]
      }
    })
  },
  'PUT /elasticsearch/:id/search_template/:template_id': function(req, res){
    res.send({
      "_id": "c1nc0dkagrh0jobkn6s0",
      "_source": {
        "cluster_id": "c0octmtath23m973pf4g",
        "created": "2021-04-08T16:35:02.746223+08:00",
        "name": "test_search_template1",
        "source": "{\"query\":{\"match\":{\"{{my_field}}\":\"{{my_value}}\"}},\"size\":\"{{my_size}}\"}",
        "updated": "2021-04-08T22:03:25.987193+08:00"
      },
      "result": "updated"
    })
  },
  'POST /elasticsearch/:id/search_template': function(req, res){
    res.send({
      "_id": "c1nc0dkagrh0jobkn6s0",
      "_source": {
        "name": "test_search_template_new",
        "source": "{\"query\":{\"match\":{\"{{my_field}}\":\"{{my_value}}\"}},\"size\":\"{{my_size}}\"}",
        "cluster_id": "c0octmtath23m973pf4g",
        "created": "2021-04-08T16:35:02.746223+08:00",
        "updated": "2021-04-08T16:35:02.746223+08:00"
      },
      "result": "created"
    });
  },
  'GET /elasticsearch/:id/search_template/_get/:template_id': function(req, res){
    res.send({
      "found": true,
      "_index": ".infini-search-center_searchtemplate",
      "_type": "_doc",
      "_id": "c1nc0dkagrh0jobkn6s0",
      "_version": 1,
      "_source": {
        "cluster_id": "c0octmtath23m973pf4g",
        "created": "2021-04-08T16:35:02.746223+08:00",
        "name": "test_search_template",
        "source": "{\"query\":{\"match\":{\"{{my_field}}\":\"{{my_value}}\"}},\"size\":\"{{my_size}}\"}",
        "updated": "2021-04-08T16:35:02.746223+08:00"
      }
    });
  },
  'DELETE /elasticsearch/:id/search_template/:template_id': function(req, res){
    res.send({
      "_id": "c1nc0dkagrh0jobkn6s0",
      "result": "deleted"
    });
  }
}
