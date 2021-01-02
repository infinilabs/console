package model

import "time"

type InfiniReindex struct {
	ID     string `json:"id" elastic_meta:"_id"`
	Name   string `json:"name" elastic_mapping:"name:{type:text}"`
	Desc   string `json:"desc" elastic_mapping:"desc:{type:text}"`
	TaskId string `json:"task_id" elastic_mapping:"task_id:{type:keyword}"`
	Source struct {
		Index   string                 `json:"index"`
		MaxDocs int                    `json:"max_docs"`
		Query   map[string]interface{} `json:"query"`
		Sort    string                 `json:"sort"`
		Source  string                 `json:"_source"`
	} `json:"source" elastic_mapping:"source:{type:object}"`
	Dest struct {
		Index    string `json:"index"`
		Pipeline string `json:"pipeline"`
	} `json:"dest" elastic_mapping:"dest:{type:object}"`

	CreatedAt time.Time `json:"created_at" elastic_mapping:"created_at:{type:date}"`
	Status    string    `json:"status" elastic_mapping:"status:{type:keyword}"`
}
