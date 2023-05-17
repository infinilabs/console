package model

import "fmt"

type ExecutionConfig struct {
	TimeWindow []TimeWindowItem `json:"time_window"`
	Nodes      struct {
		Permit []ExecutionNode `json:"permit"`
	} `json:"nodes"`
}

type ExecutionNode struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type TimeWindowItem struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

type IndexPartition struct {
	FieldType string      `json:"field_type"`
	FieldName string      `json:"field_name"`
	Step      interface{} `json:"step"`
}

type IndexInfo struct {
	Name    string `json:"name"`
	DocType string `json:"doc_type"`
	// NOTE: == 0 for migration target index
	Docs             int64 `json:"docs"`
	StoreSizeInBytes int   `json:"store_size_in_bytes"`
}

func (ii *IndexInfo) GetUniqueIndexName() string {
	return fmt.Sprintf("%s:%s", ii.Name, ii.DocType)
}

type ClusterInfo struct {
	Id           string `json:"id"`
	Name         string `json:"name"`
	Distribution string `json:"distribution,omitempty"`
}
