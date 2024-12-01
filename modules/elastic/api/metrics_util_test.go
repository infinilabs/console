package api

import (
	"fmt"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"net/http"
	"testing"
	"time"
)

func TestGetMetricParams(t *testing.T) {
	handler:=APIHandler{}
	req:=http.Request{}
	bucketSize, min, max, err:=handler.getMetricRangeAndBucketSize(&req,60,15)

	fmt.Println(bucketSize)
	fmt.Println(util.FormatUnixTimestamp(min/1000))//2022-01-27 15:28:57
	fmt.Println(util.FormatUnixTimestamp(max/1000))//2022-01-27 15:28:57
	fmt.Println(time.Now())//2022-01-27 15:28:57

	fmt.Println(bucketSize, min, max, err)
}

func TestConvertBucketItemsToAggQueryParams(t *testing.T) {
	bucketItem:=common.BucketItem{}
	bucketItem.Key="key1"
	bucketItem.Type=common.TermsBucket
	bucketItem.Parameters=map[string]interface{}{}
	bucketItem.Parameters["field"]="metadata.labels.cluster_id"
	bucketItem.Parameters["size"]=2


	nestBucket:=common.BucketItem{}
	nestBucket.Key="key2"
	nestBucket.Type=common.DateHistogramBucket
	nestBucket.Parameters=map[string]interface{}{}
	nestBucket.Parameters["field"]="timestamp"
	nestBucket.Parameters["calendar_interval"]="1d"
	nestBucket.Parameters["time_zone"]="+08:00"

	leafBucket:=common.NewBucketItem(common.TermsBucket,util.MapStr{
		"size":5,
		"field":"payload.elasticsearch.cluster_health.status",
	})

	leafBucket.Key="key3"

	metricItems:=[]*common.MetricItem{}
	var bucketSizeStr ="10s"
	metricItem:=newMetricItem("cluster_summary", 2, "cluster")
	metricItem.Key="key4"
	metricItem.AddLine("Indexing","Total Indexing","Number of documents being indexed for primary and replica shards.","group1",
		"payload.elasticsearch.index_stats.total.indexing.index_total","max",bucketSizeStr,"doc/s","num","0,0.[00]","0,0.[00]",false,true)
	metricItem.AddLine("Search","Total Search","Number of search requests being executed across primary and replica shards. A single search can run against multiple shards!","group1",
		"payload.elasticsearch.index_stats.total.search.query_total","max",bucketSizeStr,"query/s","num","0,0.[00]","0,0.[00]",false,true)
	metricItems=append(metricItems,metricItem)

	nestBucket.AddNestBucket(leafBucket)
	nestBucket.Metrics=metricItems

	bucketItem.Buckets=[]*common.BucketItem{}
	bucketItem.Buckets=append(bucketItem.Buckets,&nestBucket)


	aggs:=ConvertBucketItemsToAggQuery([]*common.BucketItem{&bucketItem},nil)
	fmt.Println(util.MustToJSON(aggs))

	response:="{ \"took\": 37, \"timed_out\": false, \"_shards\": { \"total\": 1, \"successful\": 1, \"skipped\": 0, \"failed\": 0 }, \"hits\": { \"total\": { \"value\": 10000, \"relation\": \"gte\" }, \"max_score\": null, \"hits\": [] }, \"aggregations\": { \"key1\": { \"doc_count_error_upper_bound\": 0, \"sum_other_doc_count\": 0, \"buckets\": [ { \"key\": \"c7pqhptj69a0sg3rn05g\", \"doc_count\": 80482, \"key2\": { \"buckets\": [ { \"key_as_string\": \"2022-01-28T00:00:00.000+08:00\", \"key\": 1643299200000, \"doc_count\": 14310, \"c7qi5hii4h935v9bs91g\": { \"value\": 15680 }, \"key3\": { \"doc_count_error_upper_bound\": 0, \"sum_other_doc_count\": 0, \"buckets\": [] }, \"c7qi5hii4h935v9bs920\": { \"value\": 2985 } }, { \"key_as_string\": \"2022-01-29T00:00:00.000+08:00\", \"key\": 1643385600000, \"doc_count\": 66172, \"c7qi5hii4h935v9bs91g\": { \"value\": 106206 }, \"key3\": { \"doc_count_error_upper_bound\": 0, \"sum_other_doc_count\": 0, \"buckets\": [] }, \"c7qi5hii4h935v9bs920\": { \"value\": 20204 }, \"c7qi5hii4h935v9bs91g_deriv\": { \"value\": 90526 }, \"c7qi5hii4h935v9bs920_deriv\": { \"value\": 17219 } } ] } }, { \"key\": \"c7qi42ai4h92sksk979g\", \"doc_count\": 660, \"key2\": { \"buckets\": [ { \"key_as_string\": \"2022-01-29T00:00:00.000+08:00\", \"key\": 1643385600000, \"doc_count\": 660, \"c7qi5hii4h935v9bs91g\": { \"value\": 106206 }, \"key3\": { \"doc_count_error_upper_bound\": 0, \"sum_other_doc_count\": 0, \"buckets\": [] }, \"c7qi5hii4h935v9bs920\": { \"value\": 20204 } } ] } } ] } } }"
	res:=SearchResponse{}
	util.FromJSONBytes([]byte(response),&res)
	fmt.Println(response)
		groupKey:="key1"
		metricLabelKey:="key2"
		metricValueKey:="c7qi5hii4h935v9bs920"
	data:=ParseAggregationResult(int(10),res.Aggregations,groupKey,metricLabelKey,metricValueKey)
	fmt.Println(data)

}

func TestConvertBucketItems(t *testing.T) {
	response:="{ \"took\": 8, \"timed_out\": false, \"_shards\": { \"total\": 1, \"successful\": 1, \"skipped\": 0, \"failed\": 0 }, \"hits\": { \"total\": { \"value\": 81, \"relation\": \"eq\" }, \"max_score\": null, \"hits\": [] }, \"aggregations\": { \"c7v2gm3i7638vvo4pv80\": { \"doc_count_error_upper_bound\": 0, \"sum_other_doc_count\": 0, \"buckets\": [ { \"key\": \"c7uv7p3i76360kgdmpb0\", \"doc_count\": 81, \"c7v2gm3i7638vvo4pv8g\": { \"buckets\": [ { \"key_as_string\": \"2022-02-05T00:00:00.000+08:00\", \"key\": 1643990400000, \"doc_count\": 81, \"c7v2gm3i7638vvo4pv90\": { \"doc_count_error_upper_bound\": 0, \"sum_other_doc_count\": 0, \"buckets\": [ { \"key\": \"yellow\", \"doc_count\": 81 } ] } } ] } } ] } } }"
	res:=SearchResponse{}
	util.FromJSONBytes([]byte(response),&res)

	data:=ParseAggregationBucketResult(int(10),res.Aggregations,"c7v2gm3i7638vvo4pv80","c7v2gm3i7638vvo4pv8g","c7v2gm3i7638vvo4pv90", func() {

	})

	fmt.Println(data)

}
