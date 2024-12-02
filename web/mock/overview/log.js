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
    "GET /elasticsearch/:cluster_id/node/:node_id/logs/_list": function (req, res) {
      res.send({
        "log_files": [
            {
            "modify_time": "2022-09-20T13:28:42.485405141+08:00",
            "name": "elasticsearch.log",
            "size_in_bytes": 1025
            },
            {
            "modify_time": "2022-08-30T10:00:09.837177086+08:00",
            "name": "elasticsearch_deprecation.json",
            "size_in_bytes": 135447
            },
            {
            "modify_time": "2022-09-20T15:49:25.943416021+08:00",
            "name": "elasticsearch_deprecation.log",
            "size_in_bytes": 58551107
            },
            {
            "modify_time": "2022-09-20T13:28:42.485397245+08:00",
            "name": "elasticsearch_server.json",
            "size_in_bytes": 2467
            },
            {
            "modify_time": "2022-09-20T15:49:26.235728087+08:00",
            "name": "gc.log",
            "size_in_bytes": 5228180
            }
        ],
        "success": true
        })
    },
    
    "POST /elasticsearch/:cluster_id/node/:node_id/logs/_read": function (req, res) {
        res.send({
            "has_more": true,
            "lines": [
                {
                    "bytes": 101,
                    "content": "[2022-09-20T04:20:15.205+0000][69147][gc,marking  ] GC(45738) Concurrent Clear Claimed Marks 0.103ms",
                    "line_number": 11,
                    "offset": 1248
                },
                {
                    "bytes": 91,
                    "content": "[2022-09-20T04:20:15.205+0000][69147][gc,marking  ] GC(45738) Concurrent Scan Root Regions",
                    "line_number": 12,
                    "offset": 1339
                },
                {
                    "bytes": 99,
                    "content": "[2022-09-20T04:20:15.209+0000][69147][gc,marking  ] GC(45738) Concurrent Scan Root Regions 3.226ms",
                    "line_number": 13,
                    "offset": 1438
                },
                {
                    "bytes": 92,
                    "content": "[2022-09-20T04:20:15.209+0000][69147][gc,marking  ] GC(45738) Concurrent Mark (833221.069s)",
                    "line_number": 14,
                    "offset": 1530
                },
                {
                    "bytes": 89,
                    "content": "[2022-09-20T04:20:15.209+0000][69147][gc,marking  ] GC(45738) Concurrent Mark From Roots",
                    "line_number": 15,
                    "offset": 1619
                },
                {
                    "bytes": 95,
                    "content": "[2022-09-20T04:20:15.209+0000][69147][gc,task     ] GC(45738) Using 2 workers of 2 for marking",
                    "line_number": 16,
                    "offset": 1714
                },
                {
                    "bytes": 99,
                    "content": "[2022-09-20T04:20:15.376+0000][69147][gc,marking  ] GC(45738) Concurrent Mark From Roots 166.973ms",
                    "line_number": 17,
                    "offset": 1813
                },
                {
                    "bytes": 82,
                    "content": "[2022-09-20T04:20:15.376+0000][69147][gc,marking  ] GC(45738) Concurrent Preclean",
                    "line_number": 18,
                    "offset": 1895
                },
                {
                    "bytes": 90,
                    "content": "[2022-09-20T04:20:15.376+0000][69147][gc,marking  ] GC(45738) Concurrent Preclean 0.477ms",
                    "line_number": 19,
                    "offset": 1985
                },
                {
                    "bytes": 115,
                    "content": "[2022-09-20T04:20:15.376+0000][69147][gc,marking  ] GC(45738) Concurrent Mark (833221.069s, 833221.236s) 167.521ms",
                    "line_number": 20,
                    "offset": 2100
                }
            ]
        })
      },
};