/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package migration

type ElasticDataConfig struct {
	Cluster struct {
		Source ClusterInfo `json:"source"`
		Target ClusterInfo `json:"target"`
	} `json:"cluster"`
	Indices []IndexConfig `json:"indices"`
	Settings struct {
		ParallelIndices      int `json:"parallel_indices"`
		ParallelTaskPerIndex int `json:"parallel_task_per_index"`
		ScrollSize           struct {
			Docs int    `json:"docs"`
			Timeout   string `json:"timeout"`
		} `json:"scroll_size"`
		BulkSize struct {
			Docs        int `json:"docs"`
			StoreSizeInMB int `json:"store_size_in_mb"`
		} `json:"bulk_size"`
		Execution ExecutionConfig `json:"execution"`
	} `json:"settings"`
	Creator struct {
		Name string `json:"name"`
		Id   string `json:"id"`
	} `json:"creator"`
}

type ExecutionConfig struct {
	TimeWindow []TimeWindowItem `json:"time_window"`
	Nodes struct{
		Permit []ExecutionNode `json:"permit"`
	} `json:"nodes"`
}

type ExecutionNode struct {
	ID string `json:"id"`
	Name string `json:"name"`
}

type TimeWindowItem struct {
	Start string `json:"start"`
	End string `json:"end"`
}

type IndexConfig struct {
	Source IndexInfo `json:"source"`
	Target IndexInfo `json:"target"`
	RawFilter interface{} `json:"raw_filter"`
	IndexRename map[string]interface{} `json:"index_rename"`
	TypeRename map[string]interface{} `json:"type_rename"`
	Partition *IndexPartition `json:"partition,omitempty"`
	TaskID string `json:"task_id,omitempty"`
	Status string `json:"status,omitempty"`
	Percent float64 `json:"percent,omitempty"`
	ErrorPartitions int `json:"error_partitions,omitempty"`
}
type IndexPartition struct {
	FieldType string `json:"field_type"`
	FieldName string `json:"field_name"`
	Step      interface{}    `json:"step"`
}

type IndexInfo struct {
	Name             string `json:"name"`
	DocType string `json:"doc_type"`
	Docs        int64    `json:"docs"`
	StoreSizeInBytes int    `json:"store_size_in_bytes"`
}

type ClusterInfo struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}