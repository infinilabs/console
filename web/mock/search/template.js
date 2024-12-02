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
  },
  'GET /elasticsearch/:id/search_template_history/_search': function(req, res){
    res.send({
      "took": 0,
      "timed_out": false,
      "hits": {
        "total": {
          "relation": "eq",
          "value": 1
        },
        "max_score": 0.5753642,
        "hits": [
          {
            "_index": ".infini-search-center_searchtemplatehistory",
            "_type": "_doc",
            "_id": "c1o5k3kagrh1tfml0qfg",
            "_source": {
              "action": "update",
              "content": {
                "cluster_id": "c0octmtath23m973pf4g",
                "created": "2021-04-08T16:35:02.746223+08:00",
                "name": "test_search_template",
                "source": "{\"query\":{\"match\":{\"{{my_field}}\":\"{{my_value}}\"}},\"size\":\"{{my_size}}\"}",
                "updated": "2021-04-08T22:03:25.987193+08:00"
              },
              "created": "2021-04-09T21:43:42.611027+08:00",
              "template_id": "c1nc0dkagrh0jobkn6s0"
            }
          }
        ]
      }
    });
  }
}
