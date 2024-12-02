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

import { delay } from './utils';

export default {
    "POST /_search-center/insight": function (req, res) {
        delay(res, {
            "result": "created",
            "_id": "c8i18llath2blrusdjnx"
        })
    },

    "DELETE /_search-center/insight/:id": function (req, res) {
        delay(res, {
            "result": "created",
            "_id": "c8i18llath2blrusdjnx"
        })
    },

    "PUT /_search-center/insight/:id": function (req, res) {
        delay(res, {
            "result": "updated",
            "_id": "c8i18llath2blrusdjnx"
        })
    },

    'GET /_search-center/insight': function (req, res) {
        delay(res, {
            "took": 1,
            "timed_out": false,
            "hits": {
                "total": {
                    "relation": "eq",
                    "value": 1
                },
                "max_score": 0,
                "hits": [
                    {
                        "_index": ".infini_dashboard",
                        "_type": "_doc",
                        "_id": "caav51lath2bggch9rax",
                        "_source": {
                            "created": "2022-05-31T18:48:38.215261+08:00",
                            "id": "caav51lath2bggch9rax",
                            "updated": "2022-06-02T18:12:28.122918+08:00",
                            "title": "test1",
                            "description": "a insight for test",
                            "author": "test",
                            "category": "category test1",
                            "index_pattern": ".infini_metrics*",
                            "cluster_id": "",
                            "visualizations": [
                                "caav51lath2bggch9rag",
                            ]
                        }
                    },
                    {
                        "_index": ".infini_dashboard",
                        "_type": "_doc",
                        "_id": "caav51lath2bggch9rax",
                        "_source": {
                            "created": "2022-05-31T18:48:38.215261+08:00",
                            "id": "caav51lath2bggch9rax",
                            "updated": "2022-06-02T18:12:28.122918+08:00",
                            "title": "test2",
                            "description": "a insight for test",
                            "author": "test",
                            "category": "category test2",
                            "index_pattern": ".infini_metrics*",
                            "cluster_id": "",
                            "visualizations": [
                                "caav51lath2bggch9rag",
                            ]
                        }
                    }
                ]
            }
        })
    },
};