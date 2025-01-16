/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package insight

type Function interface {
	//GenerateAggregation generates aggregation for specify function, e.g. rate, latency ...
	//
	// metricName: The name of the metric to be calculated (used as an identifier in the aggregation).
	GenerateAggregation(metricName string) (map[string]interface{}, error)
}
