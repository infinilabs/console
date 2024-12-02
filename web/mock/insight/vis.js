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