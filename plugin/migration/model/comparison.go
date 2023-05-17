package model

import "infini.sh/framework/core/util"

type ClusterComparisonTaskConfig struct {
	Cluster struct {
		Source ClusterInfo `json:"source"`
		Target ClusterInfo `json:"target"`
	} `json:"cluster"`
	Indices  []ClusterComparisonIndexConfig `json:"indices"`
	Settings struct {
		Dump      DumpHashConfig  `json:"dump"`
		Diff      IndexDiffConfig `json:"diff"`
		Execution ExecutionConfig `json:"execution"`
	} `json:"settings"`
	Creator struct {
		Name string `json:"name"`
		Id   string `json:"id"`
	} `json:"creator"`
}

type ClusterComparisonIndexConfig struct {
	Source    IndexInfo       `json:"source"`
	Target    IndexInfo       `json:"target"`
	RawFilter interface{}     `json:"raw_filter"`
	Partition *IndexPartition `json:"partition,omitempty"`

	// only used in API
	Percent         float64 `json:"percent,omitempty"`
	ErrorPartitions int     `json:"error_partitions,omitempty"`
}

type IndexComparisonTaskConfig struct {
	Source    IndexComparisonDumpConfig `json:"source"`
	Target    IndexComparisonDumpConfig `json:"target"`
	Diff      IndexComparisonDiffConfig `json:"diff"`
	Execution ExecutionConfig           `json:"execution"`
}

type IndexComparisonDumpConfig struct {
	ClusterId string `json:"cluster_id"`
	Indices   string `json:"indices"`

	SliceSize     int         `json:"slice_size"`
	BatchSize     int         `json:"batch_size"`
	PartitionSize int         `json:"partition_size"`
	ScrollTime    string      `json:"scroll_time"`
	QueryString   string      `json:"query_string,omitempty"`
	QueryDSL      util.MapStr `json:"query_dsl,omitempty"`

	DocCount int64 `json:"doc_count"`
}

type IndexComparisonDiffConfig struct {
}
