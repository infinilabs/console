package model

import (
	"fmt"
	"infini.sh/framework/core/orm"
	"strings"
	"time"

	"infini.sh/framework/core/elastic"
)

type ReindexStatus string

const (
	ReindexStatusRunning ReindexStatus = "RUNNING"
	ReindexStatusSuccess ReindexStatus = "SUCCEED"
	ReindexStatusFailed  ReindexStatus = "FAILED"
)

//const IndexReindex = ".reindex"

type Reindex struct {
	ID     string `json:"id" elastic_meta:"_id"`
	Name   string `json:"name" elastic_mapping:"name:{type:text}"`
	Desc   string `json:"desc" elastic_mapping:"desc:{type:text}"`
	TaskId string `json:"task_id" elastic_mapping:"task_id:{type:keyword}"`
	Source struct {
		Index string `json:"index"`
		//Size   int                    `json:"size"`
		Query  map[string]interface{} `json:"query"`
		Source []string               `json:"_source"`
	} `json:"source" elastic_mapping:"source:{type:object}"`
	Dest struct {
		Index    string `json:"index"`
		Pipeline string `json:"pipeline"`
	} `json:"dest" elastic_mapping:"dest:{type:object}"`

	CreatedAt time.Time     `json:"created_at" elastic_mapping:"created_at:{type:date}"`
	Status    ReindexStatus `json:"status" elastic_mapping:"status:{type:keyword}"`
}

func GetRebuildList(esName string, from, size int, name string) (*elastic.SearchResponse, error) {
	var (
		sort = `[{
      "created_at": {
        "order": "desc"
      }}]`
		query = `{
    "bool": {
      "must": [
		%s
      ]
    }
  }`
		must = ""
	)
	if name = strings.Trim(name, " "); name != "" {
		must = fmt.Sprintf(`{"match":{"name": "%s"}}`, name)
	}
	query = fmt.Sprintf(query, must)
	rq := fmt.Sprintf(`{"from":%d, "size":%d, "sort": %s, "query": %s}`, from, size, sort, query)
	client := elastic.GetClient(esName)
	return client.SearchWithRawQueryDSL(orm.GetIndexName(Reindex{}), []byte(rq))
}
