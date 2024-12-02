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
    "GET /host/_discover": function (req, res) {
        res.send([
            {
                "node_name": "node-1",
                "node_uuid": "GFdfqiEuQaaFesQ4iB_5mg",
                "agent_host": "192.168.3.21",
                "agent_id": "cc8mh1lath20duvhue10",
                "host_name": "test1",
                "ip": "192.168.3.21",
                "os_name": "Linux",
                "source": "es_node"
            },
            {
                "node_name": "node-2",
                "node_uuid": "GFdfqiEuQaaFesQ4iB_6mg",
                "agent_host": "192.168.3.21",
                "agent_id": "cc8mh1lath20duvhue11",
                "host_name": "test2",
                "ip": "192.168.3.22",
                "os_name": "darwin",
                "source": "es_node"
            }
        ])
    },

    "POST /host/_enroll": function (req, res) {
        res.send({
            success: true
        })
    },

    "POST /host/_search": function (req, res) {
        res.send({
            "took": 74,
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
                "max_score": null,
                "hits": [{
                    "_index": ".infini_host",
                    "_type": "_doc",
                    "_id": "cccr2m0vi071g3849oi0",
                    "_score": null,
                    "_source": {
                        "id": "cccr2m0vi071g3849oi0",
                        "created": "2022-09-05T10:36:40.969476+08:00",
                        "updated": "2022-09-05T10:36:40.969476+08:00",
                        "agent_id": "cc8mq7lath20duvhukf0",
                        "ip": "192.168.3.41",
                        "name": "liugqdeMacBook-Pro.local-1",
                        "memory_size": 11968253952,
                        "disk_size": 1000240963584,
                        "cpu_info": {
                            "model": "Intel(R) Core(TM) i5-1038NG7 CPU @ 2.00GHz",
                            "physical_cpu": 4,
                            "logical_cpu": 8
                        },
                        "os_info": {
                            "platform": "darwin",
                            "platform_version": "11.1",
                            "kernel_version": "20.2.0",
                            "kernel_arch": "x86_64"
                        },
                        "up_time": "2022-08-20T11:06:23+08:00",
                        "timestamp": "2022-09-05T10:36:40.969455+08:00",
                        "agent_status": "offline",
                        "tags": ['default', 'test1']
                    },
                    "sort": [1662345400969]
                },{
                    "_index": ".infini_host",
                    "_type": "_doc",
                    "_id": "cccrdfgvi071g384tkig",
                    "_score": null,
                    "_source": {
                        "id": "cccrdfgvi071g384tkig",
                        "created": "2022-09-05T10:36:40.969476+08:00",
                        "updated": "2022-09-05T10:36:40.969476+08:00",
                        "agent_id": "cc8mq7lath20duvhukf0",
                        "ip": "192.168.3.42",
                        "name": "liugqdeMacBook-Pro.local-2",
                        "memory_size": 11968253952,
                        "disk_size": 1000240963584,
                        "cpu_info": {
                            "model": "Intel(R) Core(TM) i5-1038NG7 CPU @ 2.00GHz",
                            "physical_cpu": 4,
                            "logical_cpu": 8
                        },
                        "os_info": {
                            "platform": "darwin",
                            "platform_version": "11.1",
                            "kernel_version": "20.2.0",
                            "kernel_arch": "x86_64"
                        },
                        "up_time": "2022-08-20T11:06:23+08:00",
                        "timestamp": "2022-09-05T10:36:40.969455+08:00",
                        "agent_status": "offline",
                        "tags": ['default', 'test2']
                    },
                    "sort": [1662345400969]
                },{
                    "_index": ".infini_host",
                    "_type": "_doc",
                    "_id": "cccsek0vi071g386m9tg",
                    "_score": null,
                    "_source": {
                        "id": "cccsek0vi071g386m9tg",
                        "created": "2022-09-05T10:36:40.969476+08:00",
                        "updated": "2022-09-05T10:36:40.969476+08:00",
                        "agent_id": "cc8mq7lath20duvhukf0",
                        "ip": "192.168.3.42",
                        "name": "liugqdeMacBook-Pro.local-2",
                        "memory_size": 11968253952,
                        "disk_size": 1000240963584,
                        "cpu_info": {
                            "model": "Intel(R) Core(TM) i5-1038NG7 CPU @ 2.00GHz",
                            "physical_cpu": 4,
                            "logical_cpu": 8
                        },
                        "os_info": {
                            "platform": "darwin",
                            "platform_version": "11.1",
                            "kernel_version": "20.2.0",
                            "kernel_arch": "x86_64"
                        },
                        "up_time": "2022-08-20T11:06:23+08:00",
                        "timestamp": "2022-09-05T10:36:40.969455+08:00",
                        "agent_status": "offline",
                        "tags": ['default', 'test2']
                    },
                    "sort": [1662345400969]
                }]
            }
        })
    },

    "POST /host/info": function (req, res) {
        res.send({
            "cccr2m0vi071g3849oi0": {
              "metrics": {
                "agent_status": {
                  "data": null,
                  "metric": {
                    "label": "Recent Agent Status",
                    "units": "day"
                  }
                }
              },
              "summary": {
                "cpu_usage": {
                  "idle": 32202347.968749996,
                  "iowait": 0,
                  "load": {
                    "load1": 0.007133518785361327,
                    "load15": 0.00471576346333108,
                    "load5": 0.010193554656527314
                  },
                  "system": 2613592.7343750037,
                  "used_percent": 58.333333333333336,
                  "user": 905563.140625
                },
                "memory": {
                  "available_in_bytes": 36728737792,
                  "total_in_bytes": 137120075776,
                  "used_in_bytes": 100391337984,
                  "used_percent": 73
                }
              }
            },
            "cccrdfgvi071g384tkig": {
              "metrics": {
                "agent_status": {
                  "data": [
                    [
                      "2022-08-26-2022-08-27",
                      "offline"
                    ],
                    [
                      "2022-08-27-2022-08-28",
                      "offline"
                    ],
                    [
                      "2022-08-28-2022-08-29",
                      "offline"
                    ],
                    [
                      "2022-08-29-2022-08-30",
                      "offline"
                    ],
                    [
                      "2022-08-30-2022-08-31",
                      "offline"
                    ],
                    [
                      "2022-08-31-2022-09-01",
                      "offline"
                    ],
                    [
                      "2022-09-01-2022-09-02",
                      "offline"
                    ],
                    [
                      "2022-09-02-2022-09-03",
                      "offline"
                    ],
                    [
                      "2022-09-03-2022-09-04",
                      "offline"
                    ],
                    [
                      "2022-09-04-2022-09-05",
                      "offline"
                    ],
                    [
                      "2022-09-05-2022-09-06",
                      "offline"
                    ],
                    [
                      "2022-09-06-2022-09-07",
                      "offline"
                    ],
                    [
                      "2022-09-07-2022-09-08",
                      "offline"
                    ],
                    [
                      "2022-09-08-2022-09-08",
                      "online"
                    ]
                  ],
                  "metric": {
                    "label": "Recent Agent Status",
                    "units": "day"
                  }
                }
              },
              "summary": {
                "cpu_usage": {
                  "idle": 608939.7,
                  "iowait": 2922.89,
                  "load": {
                    "load1": 1.66,
                    "load15": 1.48,
                    "load5": 1.55
                  },
                  "system": 6774.81,
                  "used_percent": 79.9999999825377,
                  "user": 36844.46
                },
                "disk_usage_summary": {
                  "free_in_bytes": 158593118208,
                  "partition": "all",
                  "total_in_bytes": 211262263296,
                  "used_in_bytes": 41844486144,
                  "used_percent": 19.806890966311197
                },
                "memory": {
                  "available_in_bytes": 3036426240,
                  "total_in_bytes": 8263380992,
                  "used_in_bytes": 4934139904,
                  "used_percent": 59.71090899447663
                }
              }
            },
            "cccsek0vi071g386m9tg": {
              "metrics": {
                "agent_status": {
                  "data": null,
                  "metric": {
                    "label": "Recent Agent Status",
                    "units": "day"
                  }
                }
              },
              "summary": null
            }
          })
    },

    "GET /host/:id/info": function (req, res) {
        res.send({
          "agent_status": "online",
          "host_mame": "infini",
          "ip": "192.168.3.188",
          "os_info": {
            "platform": "Windows 10",
            "kernel_arch": "amd64"
          },
          "summary": {
            "cpu_usage": {
              "used_percent": 6
            },
            "disk_usage_summary": {
              "free_in_bytes": 21720087085056,
              "total_in_bytes": 24002405851136,
              "used_in_bytes": 2282318766080,
              "used_percent": 9.508708336301968
            },
            "memory": {
              "available_in_bytes": 29049266176,
              "total_in_bytes": 137120075776,
              "used_in_bytes": 108070809600,
              "used_percent": 79
            }
          }
        })
    },

    "GET /host/:host_id/metrics": function (req, res) {
        res.send({
          "metrics": {
              "cpu_usage": {
                  "key": "cpu_used_percent",
                  "axis": [
                      {
                          "id": "ccbakr5ath2csv55m8tg",
                          "group": "group1",
                          "title": "cpu",
                          "formatType": "ratio",
                          "position": "left",
                          "tickFormat": "0.[0]",
                          "ticks": 5,
                          "labelFormat": "0.[0]",
                          "showGridLines": true
                      }
                  ],
                  "lines": [
                      {
                          "timeRange": {
                              "min": 1662429760000,
                              "max": 1662429780000
                          },
                          "data": [
                              [
                                  1662429760000,
                                  0
                              ],
                              [
                                  1662429770000,
                                  93.10344696044922
                              ],
                              [
                                  1662429780000,
                                  34.177215576171875
                              ]
                          ],
                          "bucket_size": "10s",
                          "metric": {
                              "group": "group1",
                              "title": "CPU Used Percent",
                              "label": "CPU Used Percent",
                              "description": "cpu used percent of host.",
                              "metricAgg": "max",
                              "field": "payload.host.cpu_usage.used_percent",
                              "formatType": "num",
                              "format": "0,0.[00]",
                              "tickFormat": "0,0.[00]",
                              "units": "%",
                              "hasCalculation": false,
                              "isDerivative": false
                          },
                          "color": "",
                          "type": ""
                      }
                  ],
                  "group": "system",
                  "order": 1
              },
              "memory": {
                  "key": "memory_used_percent",
                  "axis": [
                      {
                          "id": "ccbakr5ath2csv55m8ug",
                          "group": "group1",
                          "title": "Memory",
                          "formatType": "ratio",
                          "position": "left",
                          "tickFormat": "0.[0]",
                          "ticks": 5,
                          "labelFormat": "0.[0]",
                          "showGridLines": true
                      }
                  ],
                  "lines": [
                      {
                          "timeRange": {
                              "min": 1662429760000,
                              "max": 1662429780000
                          },
                          "data": [
                                [
                                    1662429760000,
                                    0
                                ],
                                [
                                    1662429770000,
                                    93.10344696044922
                                ],
                                [
                                    1662429780000,
                                    34.177215576171875
                                ]
                            ],
                          "bucket_size": "10s",
                          "metric": {
                              "group": "group1",
                              "title": "Memory Used Percent",
                              "label": "Memory Used Percent",
                              "description": "memory used percent of host.",
                              "metricAgg": "max",
                              "field": "payload.host.memory.mem_used_percent",
                              "formatType": "num",
                              "format": "0,0.[00]",
                              "tickFormat": "0,0.[00]",
                              "units": "%",
                              "hasCalculation": false,
                              "isDerivative": false
                          },
                          "color": "",
                          "type": ""
                      }
                  ],
                  "group": "system",
                  "order": 1
              }
          }
      })
    },

    "GET /host/:host_id/agent/info": function (req, res) {
        res.send({
            "agent_id": "ccamj7tath25fpts3aug",
            "host_id": "ccar86tath23eru18g6g",
            "ip": "192.168.3.4",
            "port": 8080,
            "schema": "http",
            "status": "online",
            "version": {
                "build_date": "2022-09-06T03:54:45Z",
                "build_hash": "6fc417264da9c30d9ec717ba820f1e217104f706",
                "build_number": "001",
                "eol_date": "2023-12-31T10:10:10Z",
                "number": "1.0.0_SNAPSHOT"
            }
        })
    },

    "GET /host/:host_id/processes": function (req, res) {
        res.send({
            "elastic_processes": [
                {
                    "cluster_id": "c8i18llath2blrusdjng",
                    "cluster_name": "elasticsearch",
                    "cluster_uuid": "Uv8f2wfCSymmeqsXKjH1jw",
                    "node_id": "Z1IcUTaHQiOSL1M3sKubEw",
                    "node_name": "liugqdeMacBook-Pro.local",
                    "pid": 0,
                    "pid_status": "",
                    "uptime_in_ms": 1662456715064
                }
            ]
        })
    },

    "GET /host/:host_id": function (req, res) {
        res.send({
            "_id": "ccar86tath23eru18g6g",
            "_source": {
                "id": "ccar86tath23eru18g6g",
                "created": "2022-09-05T16:32:27.318704+08:00",
                "updated": "2022-09-05T16:32:27.318704+08:00",
                "agent_id": "ccamj7tath25fpts3aug",
                "ip": "192.168.3.4",
                "name": "liugqdeMacBook-Pro.local",
                "memory_size": 11383373824,
                "disk_size": 1000240963584,
                "cpu_info": {
                    "model": "Intel(R) Core(TM) i5-1038NG7 CPU @ 2.00GHz",
                    "physical_cpu": 4,
                    "logical_cpu": 8
                },
                "os_info": {
                    "platform": "darwin",
                    "platform_version": "11.1",
                    "kernel_version": "20.2.0",
                    "kernel_arch": "x86_64"
                },
                "up_time": "2022-08-20T11:06:23+08:00",
                "timestamp": "2022-09-05T16:32:27.318688+08:00",
                "agent_status": "online"
            },
            "found": true
        })
    },

    "GET /host/:host_id/metric/_stats": function (req, res) {
        res.send([
            {
                "metric_name": "memory",
                "status": "success",
                "timestamp": "2022-09-07T14:30:28.980537+08:00"
            },
            {
                "metric_name": "cpu_usage",
                "status": "success",
                "timestamp": "2022-09-07T14:30:28.979157+08:00"
            },
            {
                "metric_name": "disk_usage_summary",
                "status": "success",
                "timestamp": "2022-09-07T14:30:28.874696+08:00"
            },
            {
                "metric_name": "network_summary",
                "status": "success",
                "timestamp": "2022-09-07T14:30:28.872048+08:00"
            },
            {
                "metric_name": "disk_io_summary",
                "status": "success",
                "timestamp": "2022-09-07T14:30:28.872992+08:00"
            }
        ])
    },

    "PUT /host/:host_id": function (req, res) {
        res.send({
            "_id":   ":host_id",
            "result": "updated"
       })
    },
};