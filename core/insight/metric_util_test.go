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

/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package insight

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"infini.sh/framework/core/util"
)

func TestCollectMetricDataWithPercentage(t *testing.T) {
	// Define test cases in a table
	testCases := []struct {
		name         string
		metric       Metric
		esResponse   []byte
		expectedData struct {
			groupLength      int
			percentageValues map[string]float64
		}
	}{
		{
			name: "Single group with time field",
			metric: Metric{
				TimeField:  "timestamp",
				BucketSize: "1m",
				Filter: util.MapStr{
					"bool": util.MapStr{
						"must": []util.MapStr{
							{
								"terms": util.MapStr{
									"metadata.name": []string{
										"cluster_health",
										"node_stats",
									},
								},
							},
						},
					},
				},
				Groups: []MetricGroupItem{
					{
						Field: "metadata.name",
						Limit: 5,
					},
				},
				ClusterId: "infini_default_system_cluster",
				Formula:   "a",
				Items: []MetricItem{
					{
						Name:      "a",
						Field:     "metadata.name",
						Statistic: "percentage",
					},
				},
				TimeFilter: util.MapStr{
					"range": util.MapStr{
						"timestamp": util.MapStr{
							"gte": 1753933474878,
							"lte": 1753933594878,
						},
					},
				},
			},

			expectedData: struct {
				groupLength      int
				percentageValues map[string]float64
			}{
				groupLength: 2,
				percentageValues: map[string]float64{
					"cluster_health": 0.33,
					"node_stats":     0.67,
				},
			},
			esResponse: []byte(`{
  "took": 3,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 5340,
      "relation": "eq"
    },
    "max_score": null,
    "hits": []
  },
  "aggregations": {
    "filter_agg": {
      "doc_count": 21,
      "time_buckets": {
        "buckets": [
          {
            "key_as_string": "2025-07-31T03:28:00.000Z",
            "key": 1753932480000,
            "doc_count": 6,
            "d25e5rlath2b60fqskdg": {
              "doc_count_error_upper_bound": 0,
              "sum_other_doc_count": 0,
              "buckets": [
                {
                  "key": "cluster_health",
                  "doc_count": 2,
                  "a": {
                    "value": 2
                  }
                },
                {
                  "key": "node_stats",
                  "doc_count": 4,
                  "a": {
                    "value": 4
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }
}`),
		},
		{
			name: "Multi group with time field",
			metric: Metric{
				TimeField:  "timestamp",
				BucketSize: "1m",
				Filter: util.MapStr{
					"bool": util.MapStr{
						"must": []util.MapStr{
							{
								"terms": util.MapStr{
									"metadata.name": []string{
										"cluster_health",
										"node_stats",
									},
								},
							},
						},
					},
				},
				Groups: []MetricGroupItem{
					{
						Field: "metadata.name",
						Limit: 5,
					},
				},
				ClusterId: "infini_default_system_cluster",
				Formula:   "a",
				Items: []MetricItem{
					{
						Name:      "a",
						Field:     "metadata.name",
						Statistic: "percentage",
					},
				},
				TimeFilter: util.MapStr{
					"range": util.MapStr{
						"timestamp": util.MapStr{
							"gte": 1753933474878,
							"lte": 1753933594878,
						},
					},
				},
			},
			expectedData: struct {
				groupLength      int
				percentageValues map[string]float64
			}{
				groupLength: 2,
				percentageValues: map[string]float64{
					"cluster_health": 0.5,
					"node_stats":     0.5,
				},
			},
			esResponse: []byte(`{
  "took": 9,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 5219,
      "relation": "eq"
    },
    "max_score": null,
    "hits": []
  },
  "aggregations": {
    "filter_agg": {
      "doc_count": 22,
      "time_buckets": {
        "buckets": [
          {
            "key_as_string": "2025-07-31T06:08:00.000Z",
            "key": 1753942080000,
            "doc_count": 8,
            "d25ghi5ath2dtv80bajg": {
              "doc_count_error_upper_bound": 0,
              "sum_other_doc_count": 0,
              "buckets": [
                {
                  "key": "infini_default_system_cluster",
                  "doc_count": 8,
                  "d25ghi5ath2dtv80baj0": {
                    "doc_count_error_upper_bound": 0,
                    "sum_other_doc_count": 0,
                    "buckets": [
                      {
                        "key": "cluster_health",
                        "doc_count": 4,
                        "a": {
                          "value": 4
                        }
                      },
                      {
                        "key": "node_stats",
                        "doc_count": 4,
                        "a": {
                          "value": 4
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }
}`),
		},
		{
			name: "Single group without time field",
			metric: Metric{
				TimeField:  "",
				BucketSize: "1m",
				Groups: []MetricGroupItem{
					{
						Field: "metadata.name",
						Limit: 5,
					},
				},
				ClusterId: "infini_default_system_cluster",
				Formula:   "a",
				Items: []MetricItem{
					{
						Name:      "a",
						Field:     "metadata.name",
						Statistic: "percentage",
					},
				},
				TimeFilter: util.MapStr{
					"range": util.MapStr{
						"timestamp": util.MapStr{
							"gte": 1753933474878,
							"lte": 1753933594878,
						},
					},
				},
			},
			expectedData: struct {
				groupLength      int
				percentageValues map[string]float64
			}{
				groupLength: 2,
				percentageValues: map[string]float64{
					"cluster_health": 0.8,
					"node_stats":     0.2,
				},
			},
			esResponse: []byte(`{
  "took": 2,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 100,
      "relation": "eq"
    },
    "max_score": null,
    "hits": []
  },
  "aggregations": {
    "d25h8edath251bnsgl70": {
      "doc_count_error_upper_bound": 0,
      "sum_other_doc_count": 12,
      "buckets": [
        {
          "key": "node_stats",
          "doc_count": 20,
          "a": {
            "value": 20
          }
        },
        {
          "key": "cluster_health",
          "doc_count": 80,
          "a": {
            "value": 80
          }
        }
      ]
    }
  }
}`),
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Parse the ES response
			searchResult := map[string]interface{}{}
			err := util.FromJSONBytes(tc.esResponse, &searchResult)
			if err != nil {
				t.Errorf("Failed to parse ES response: %v", err)
				return
			}

			// collecting data
			metricData, _ := CollectMetricData(&tc.metric, searchResult)
			assert.Equal(t, tc.expectedData.groupLength, len(metricData), fmt.Sprintf("Expected %d groups in metric data", tc.expectedData.groupLength))
			for _, data := range metricData {
				if v, ok := tc.expectedData.percentageValues[data.Groups[len(data.Groups)-1].Value]; ok {
					assert.Equal(t, v, data.Data["a"][0].Value, fmt.Sprintf("Expected percentage value for %s to be %f", data.Groups[0].Value, v))
				} else {
					t.Errorf("Unexpected group value: %s", data.Groups[0].Value)
				}
			}
		})
	}

}
