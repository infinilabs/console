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

    "DELETE /credential/:id": function (req, res) {
      res.send({
        "_id": "ceonc4dath23u2tgnbog",
        "result": "deleted",
      })
      // res.status(500).json({
      //   "status": 500,
      //   "error": {
      //     "reason": "delete failed error: xxx",
      //   }
      //   });
    },

    "POST /credential": function (req, res) {
      res.send({
        "_id": "ceonc4dath23u2tgnbog",
        "result": "created",
      })
    },

    "PUT /credential/:id": function (req, res) {
      res.send({
        "_id": "ceonc4dath23u2tgnbog",
        "result": "updated",
      })
    },

    "GET /credential/_search": function(req, res) {
      res.send({
        "took": 0,
        "timed_out": false,
        "_shards": {
            "total": 1,
            "successful": 1,
            "skipped": 0,
            "failed": 0
        },
        "hits": {
            "total": {
                "value": 1,
                "relation": "eq"
            },
            "max_score": 1.0,
            "hits": [{
                "_index": ".infini_credential",
                "_type": "_doc",
                "_id": "ced8rttath2cpju2hg2g",
                "_score": 1.0,
                "_source": {
                    "id": "ced8rttath2cpju2hg2g",
                    "created": "2022-12-15T11:52:59.296414+08:00",
                    "updated": "2022-12-15T11:52:59.296414+08:00",
                    "name": "metric",
                    "type": "basic_auth",
                    "tags": ["default"],
                    "encrypt": {
                      "type": "AES",
                      "params": {
                        "salt": "95284d44c990a6cdf40bc31b",
                    },
                    "payload": {
                      "basic_auth": {
                        "username": "mertic",
                        "password": "2f41a712ee5"
                      }
                    }
                },
             "payload": {
              "basic_auth": {
                "username": "mertic",
                "password": "2f41a712ee5ba6e25135b29c948497d1d92eef9f8871ebed1c3811b45d6f"
              }
            }
                }
            }]
        }
    });
    },
  };
  