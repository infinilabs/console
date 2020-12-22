package model

import (
	"fmt"
	"strings"
	"time"

	"infini.sh/framework/core/orm"
)

//Dict model
type Dict struct {
	ID        string    `json:"id" elastic_meta:"_id"`
	Name      string    `json:"name,omitempty" elastic_mapping:"name:{type:text}"`
	Tags      []string  `json:"tags" elastic_mapping:"tags:{type:text}"`
	Content   []byte    `json:"content" elastic_mapping:"content:{type:binary}"`
	CreatedAt time.Time `json:"created_at" elastic_mapping:"created_at:{type:date}"`
	UpdatedAt time.Time `json:"updated_at" elastic_mapping:"updated_at:{type:date}"`
}

func GetDictList(from, size int, name string, tags []string) (orm.Result, error) {
	//sort := []orm.Sort{}
	//sort = append(sort, orm.Sort{Field: "created_at", SortType: orm.DESC})
	var (
		sort = `[{
      "created_at": {
        "order": "desc"
      }}]`
		query = `{
    "bool": {
      "must": [
		%s
      ],
      "should": [
		%s
      ],
      "minimum_should_match": %d
    }
  }`
		should    = ""
		must      = ""
		minShould = 0
	)
	if name = strings.Trim(name, " "); name != "" {
		must = fmt.Sprintf(`{"match":{"name": "%s"}}`, name)
	}
	for i, tag := range tags {
		if tag == "" {
			continue
		}
		should += fmt.Sprintf(`{"match":{"tags":"%s"}}`, tag)
		if i != len(tags)-1 {
			should += ","
		}
		minShould = 1
	}
	query = fmt.Sprintf(query, must, should, minShould)
	rq := fmt.Sprintf(`{"from":%d, "size":%d, "sort": %s, "query": %s}`, from, size, sort, query)
	//fmt.Println(rq)
	q := &orm.Query{
		//From: from,
		//Size: size,
		//Sort: &sort,
		RawQuery: []byte(rq),
	}
	//var dictList = []Dict{}
	err, sr := orm.Search(Dict{}, nil, q)
	return sr, err
}
