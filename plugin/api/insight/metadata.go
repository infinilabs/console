/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package insight

import (
	"github.com/Knetic/govaluate"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/insight"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"math"
	"net/http"
	"strings"
)

func (h *InsightAPI) HandleGetPreview(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	reqBody := struct {
		IndexPattern string      `json:"index_pattern"`
		ViewID       string      `json:"view_id"`
		TimeField    string      `json:"time_field"`
		Filter       interface{} `json:"filter"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	if reqBody.ViewID != "" {
		view := elastic.View{
			ID: reqBody.ViewID,
		}
		exists, err := orm.Get(&view)
		if err != nil || !exists {
			h.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusNotFound)
			return
		}
		reqBody.IndexPattern = view.Title
		reqBody.TimeField = view.TimeFieldName

	}
	var timeFields []string
	if reqBody.TimeField == "" {
		fieldsMeta, err := getFieldsMetadata(reqBody.IndexPattern, clusterID)
		if err != nil {
			log.Error(err)
			h.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusInternalServerError)
			return
		}
		for fieldName := range fieldsMeta.Dates {
			timeFields = append(timeFields, fieldName)
		}
	}else{
		timeFields = []string{reqBody.TimeField}
	}

	aggs := util.MapStr{
		"doc_count": util.MapStr{
			"value_count": util.MapStr{"field": "_id"},
		},
	}

	for _, tfield := range timeFields {
		aggs["maxTime_"+tfield] = util.MapStr{
			 "max": util.MapStr{ "field": tfield },
		}
		aggs["minTime_"+tfield] = util.MapStr{
			"min": util.MapStr{ "field": tfield },
		}
	}
	query := util.MapStr{
		"aggs": aggs,
	}
	if reqBody.Filter != nil {
		query["query"] = reqBody.Filter
	}

	esClient := elastic.GetClient(clusterID)
	searchRes, err := esClient.SearchWithRawQueryDSL(reqBody.IndexPattern, util.MustToJSONBytes(query))
	if err != nil {
		log.Error(err)
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	result := util.MapStr{
		"doc_count": searchRes.Aggregations["doc_count"].Value,
	}
	tfieldsM := map[string]util.MapStr{}
	for ak, av := range searchRes.Aggregations {
		if strings.HasPrefix(ak,"maxTime_") {
			tfield := ak[8:]
			if _, ok := tfieldsM[tfield]; !ok {
				tfieldsM[tfield] = util.MapStr{}
			}
			tfieldsM[tfield]["max"] = av.Value
			continue
		}
		if strings.HasPrefix(ak,"minTime_") {
			tfield := ak[8:]
			if _, ok := tfieldsM[tfield]; !ok {
				tfieldsM[tfield] = util.MapStr{}
			}
			tfieldsM[tfield]["min"] = av.Value
			continue
		}
	}
	result["time_fields"] = tfieldsM
	h.WriteJSON(w, result, http.StatusOK)

}
func (h *InsightAPI) HandleGetMetadata(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	clusterID := ps.MustGetParameter("id")
	reqBody := struct {
		IndexPattern string `json:"index_pattern"`
		ViewID string `json:"view_id"`
		TimeField string `json:"time_field"`
		Filter interface{} `json:"filter"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	var fieldsFormat map[string]string
	if reqBody.ViewID != "" {
		view := elastic.View{
			ID: reqBody.ViewID,
		}
		exists, err := orm.Get(&view)
		if err != nil || !exists {
			h.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusNotFound)
			return
		}
		reqBody.IndexPattern = view.Title
		clusterID = view.ClusterID
		reqBody.TimeField = view.TimeFieldName
		fieldsFormat, err = parseFieldsFormat(view.FieldFormatMap)
		if err != nil {
			log.Error(err)
		}

	}

	fieldsMeta, err := getMetadataByIndexPattern(clusterID, reqBody.IndexPattern, reqBody.TimeField, reqBody.Filter, fieldsFormat)
	if err != nil {
		log.Error(err)
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, fieldsMeta, http.StatusOK)
}

func (h *InsightAPI) HandleGetMetricData(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	reqBody := insight.Metric{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	clusterID := ps.MustGetParameter("id")
	reqBody.ClusterId = clusterID
	metricData, err := getMetricData(&reqBody)
	if err != nil {
		log.Error(err)
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, metricData, http.StatusOK)
}

func getMetricData(metric *insight.Metric) (interface{}, error) {
	query, err := GenerateQuery(metric)
	if err != nil {
		return nil, err
	}
	esClient := elastic.GetClient(metric.ClusterId)
	//log.Error(string(util.MustToJSONBytes(query)))
	searchRes, err := esClient.SearchWithRawQueryDSL(metric.IndexPattern, util.MustToJSONBytes(query))
	if err != nil {
		return nil, err
	}
	searchResult := map[string]interface{}{}
	err = util.FromJSONBytes(searchRes.RawResult.Body, &searchResult)
	if err != nil {
		return nil, err
	}

	var agg  = searchResult["aggregations"]
	if metric.Filter != nil {
		if aggM, ok := agg.(map[string]interface{}); ok {
			agg = aggM["filter_agg"]
		}
	}
	metricData := CollectMetricData(agg, metric.TimeBeforeGroup)

	var targetMetricData []insight.MetricData
	if len(metric.Items) == 1 {
		targetMetricData =  metricData
	}else {
		for _, md := range metricData {
			targetData := insight.MetricData{
				Group: md.Group,
				Data:  map[string][]insight.MetricDataItem{},
			}
			expression, err := govaluate.NewEvaluableExpression(metric.Formula)
			if err != nil {
				return nil, err
			}
			dataLength := 0
			for _, v := range md.Data {
				dataLength = len(v)
				break
			}
		DataLoop:
			for i := 0; i < dataLength; i++ {
				parameters := map[string]interface{}{}
				var timestamp interface{}
				hasValidData := false
				for k, v := range md.Data {
					if len(k) == 20 {
						continue
					}
					if len(v) < dataLength {
						continue
					}
					if _, ok := v[i].Value.(float64); !ok {
						continue DataLoop
					}
					hasValidData = true
					parameters[k] = v[i].Value
					timestamp = v[i].Timestamp
				}
				//todo return error?
				if !hasValidData {
					continue
				}
				result, err := expression.Evaluate(parameters)
				if err != nil {
					return nil, err
				}
				if r, ok := result.(float64); ok {
					if math.IsNaN(r) || math.IsInf(r, 0) {
						//if !isFilterNaN {
						//	targetData.Data["result"] = append(targetData.Data["result"], []interface{}{timestamp, math.NaN()})
						//}
						continue
					}
				}

				targetData.Data["result"] = append(targetData.Data["result"], insight.MetricDataItem{Timestamp: timestamp, Value: result})
			}
			targetMetricData = append(targetMetricData, targetData)
		}
	}
	result := []insight.MetricDataItem{}
	for _, md := range targetMetricData {
		for _, v := range md.Data {
			for _, mitem := range v {
				mitem.Group = md.Group
				result = append(result, mitem)
			}
		}
	}
	return result, nil
}

func getMetadataByIndexPattern(clusterID, indexPattern, timeField string, filter interface{}, fieldsFormat map[string]string) (interface{}, error){
	fieldsMeta, err := getFieldsMetadata(indexPattern, clusterID)
	if err != nil {
		return nil, err
	}
	var (
		metas []insight.Visualization
		seriesType string

		aggTypes []string
	)
	var fieldNames []string
	for fieldName := range fieldsMeta.Aggregatable {
		fieldNames = append(fieldNames, fieldName)
	}
	length := len(fieldNames)
	step := 50
	for i := 0; i<length; i=i+step {
		end := i+step
		if end > length {
			end = length
		}
		counts, err := countFieldValue(fieldNames[i:end], clusterID, indexPattern, filter)
		if err != nil {
			return nil, err
		}
		for fieldName, count := range counts {
			options := map[string]interface{}{
				"yField": "value",
			}
			if timeField != "" {
				options["xAxis"] = util.MapStr{
					"type": "time",
				}
				options["xField"] = "timestamp"
			}
			if count <= 1 {
				continue
			}
			seriesType = "line"
			aggField := fieldsMeta.Aggregatable[fieldName]
			if count <= 10 {
				if timeField == "" {
					seriesType = "pie"
				}else {
					if aggField.Type == "string"{
						seriesType = "column"
						options["seriesField"] = "group"
					}
				}
			}
			var defaultAggType string
			if aggField.Type == "string" {
				aggTypes = []string{"count", "terms"}
				defaultAggType = "count"
			} else {
				aggTypes = []string{"min", "max", "avg", "sum", "medium","count", "rate"}
				defaultAggType = "avg"
				if options["seriesField"] == "group" {
					defaultAggType = "count"
				}
			}

			if fieldsFormat != nil {
				if ft, ok := fieldsFormat[aggField.Name]; ok {
					options["yAxis"] = util.MapStr{
						"formatter": ft,
					}
				}
			}
			seriesItem := insight.SeriesItem{
				Type: seriesType,
				Options: options,
				Metric: insight.Metric{
				Items: []insight.MetricItem{
					{
						Name: "a",
						Field:     aggField.Name,
						FieldType: aggField.Type,
						Statistic: defaultAggType,

					},
				},
				AggTypes:  aggTypes,
			}}
			if seriesType == "column" || seriesType == "pie" {
				seriesItem.Metric.Groups = []insight.MetricGroupItem{
					{aggField.Name, 10},
				}
			}
			fieldVis := insight.Visualization{
				Series: []insight.SeriesItem{
					seriesItem,
				},
			}
			fieldVis.Title, _ = fieldVis.Series[0].Metric.GenerateExpression()
			metas = append(metas, fieldVis)
		}
	}
	return metas, nil
}

func countFieldValue(fields []string, clusterID, indexPattern string, filter interface{}) (map[string]float64, error){
	aggs := util.MapStr{}
	for _, field := range fields {
		aggs[field] =  util.MapStr{
			"cardinality": util.MapStr{
				"field": field,
			},
		}
	}
	queryDsl := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"sample": util.MapStr{
				"sampler": util.MapStr{
					"shard_size": 200,
				},
				"aggs": aggs,
			},
		} ,
	}
	if filter != nil {
		queryDsl["query"] = filter
		queryDsl["aggs"] = aggs
	}
	esClient := elastic.GetClient(clusterID)
	searchRes, err := esClient.SearchWithRawQueryDSL(indexPattern, util.MustToJSONBytes(queryDsl))
	if err != nil {
		return nil, err
	}
	fieldsCount := map[string] float64{}
	res := map[string]interface{}{}
	util.MustFromJSONBytes(searchRes.RawResult.Body, &res)
	if aggsM, ok := res["aggregations"].(map[string]interface{}); ok {
		if sampleAgg, ok := aggsM["sample"].(map[string]interface{}); ok {
			for key, agg := range sampleAgg {
				if key == "doc_count"{
					continue
				}
				if mAgg, ok := agg.(map[string]interface{});ok{
					fieldsCount[key] = mAgg["value"].(float64)
				}
			}
		}else{
			for key, agg := range aggsM {
				if mAgg, ok := agg.(map[string]interface{});ok{
					fieldsCount[key] = mAgg["value"].(float64)
				}
			}
		}

	}

	return fieldsCount, nil
}

type FieldsMetadata struct {
	Aggregatable map[string]elastic.ElasticField
	Dates map[string]elastic.ElasticField
}

func getFieldsMetadata(indexPattern string, clusterID string) (*FieldsMetadata, error){
	fields, err := elastic.GetFieldCaps(clusterID, indexPattern, nil)
	if err != nil {
		return nil, err
	}
	var fieldsMeta = &FieldsMetadata{
		Aggregatable: map[string]elastic.ElasticField{},
		Dates: map[string]elastic.ElasticField{},
	}
	for _, field := range fields {
		if field.Type == "date" {
			fieldsMeta.Dates[field.Name] = field
			continue
		}
		if field.Aggregatable {
			fieldsMeta.Aggregatable[field.Name] = field
		}
	}
	return fieldsMeta, nil
}

func parseFieldsFormat(formatMap string) (map[string]string, error) {
	formatObj := map[string]util.MapStr{}
	err := util.FromJSONBytes([]byte(formatMap), &formatObj)
	if err != nil {
		return nil, err
	}
	fieldsFormat := map[string]string{}
	for field, format := range formatObj {
		if fv, ok := format["id"].(string); ok {
			fieldsFormat[field] = fv
		}
	}
	return fieldsFormat, nil
}