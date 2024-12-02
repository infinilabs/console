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
    'POST /_search-center/insight/:id/visualization/metadata': function (req, res) {
        delay(res, [{
            id: "0",
            index_pattern: ".infini_metrics*",
            cluster_id: "",
            title: "metric",
            position: {
                x: 0,
                y: 0,
                h: 4, // 高
                w: 4, // 宽
            },
            series: [
                {
                    type: 'line',
                    options: {
                        xField: 'timestamp',
                        yField: 'value',
                        seriesField: 'group',
                        xAxis: {
                            type: 'time',
                        },
                        yAxis: {
                            formatter: 'bytes',
                            unit: 'ms'
                        },
                    },
                    metric: {
                        "index_pattern": ".infini_metrics*",
                        "time_field": "timestamp",
                        "bucket_size": "30s",
                        "formula": "a*100",
                        "items": [{
                            "name": "a",
                            "field": "xx",
                            "field_type": "number | keyword",
                            "agg_type": "max"
                        }],
                        "agg_types": ["max", "avg", "min"],
                        "filter": {},
                        "groups": ["cluster_id"],
                        "top": 10,
                        "cluster_id": "cluster_xxx"
                    }
                }
            ],
            x: 0,
            y: 0,
            h: 4,
            w: 4,
            id: "0",
            title: "metric 1",
            index_pattern: ".infini_metrics*",
            cluster_id: "",
            type: 'line',
        }], 3000)
    },
};