/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package model

import (
	"infini.sh/framework/core/util"
)

type ClusterMigrationTaskConfig struct {
	Name    string   `json:"name"`
	Tags    []string `json:"tags"`
	Cluster struct {
		Source ClusterInfo `json:"source"`
		Target ClusterInfo `json:"target"`
	} `json:"cluster"`
	Indices  []ClusterMigrationIndexConfig `json:"indices"`
	Settings struct {
		Scroll               EsScrollConfig     `json:"scroll"`
		Bulk                 BulkIndexingConfig `json:"bulk"`
		SkipScrollCountCheck bool               `json:"skip_scroll_count_check"`
		SkipBulkCountCheck   bool               `json:"skip_bulk_count_check"`
		Execution            ExecutionConfig    `json:"execution"`
	} `json:"settings"`
	Creator struct {
		Name string `json:"name"`
		Id   string `json:"id"`
	} `json:"creator"`
}

type ClusterMigrationIndexConfig struct {
	Source      IndexInfo              `json:"source"`
	Target      IndexInfo              `json:"target"`
	RawFilter   interface{}            `json:"raw_filter"`
	IndexRename map[string]interface{} `json:"index_rename"`
	TypeRename  map[string]interface{} `json:"type_rename"`
	Incremental *IndexIncremental      `json:"incremental"`
	Partition   *IndexPartition        `json:"partition,omitempty"`

	// only used in API
	Percent         float64 `json:"percent,omitempty"`
	ErrorPartitions int     `json:"error_partitions,omitempty"`
	RunningChildren int     `json:"running_children,omitempty"`
	ExportedPercent float64 `json:"exported_percent,omitempty"`
}

type ClusterMigrationTaskState struct {
	IndexDocs       int64
	SourceDocs      int64
	ErrorPartitions int64
	Status          string
}

const (
	IndexMigrationV0 = 0
	IndexMigrationV1 = 1
)

type IndexMigrationTaskConfig struct {
	Source    IndexMigrationSourceConfig `json:"source"`
	Target    IndexMigrationTargetConfig `json:"target"`
	Execution ExecutionConfig            `json:"execution"`
	Version   int                        `json:"version"`
}

type IndexMigrationSourceConfig struct {
	SkipCountCheck bool `json:"skip_count_check"`

	ClusterId   string      `json:"cluster_id"`
	Indices     string      `json:"indices"`
	SliceSize   int         `json:"slice_size"`
	BatchSize   int         `json:"batch_size"`
	ScrollTime  string      `json:"scroll_time"`
	IndexRename util.MapStr `json:"index_rename,omitempty"`
	TypeRename  util.MapStr `json:"type_rename,omitempty"`
	QueryString string      `json:"query_string,omitempty"`
	QueryDSL    util.MapStr `json:"query_dsl,omitempty"`
	DocCount    int64       `json:"doc_count"`

	// Parition configs
	Start       float64     `json:"start"`
	End         float64     `json:"end"`
	Step        interface{} `json:"step"`
	PartitionId int         `json:"partition_id"`
}

type IndexMigrationBulkConfig struct {
	BatchSizeInDocs      int  `json:"batch_size_in_docs"`
	BatchSizeInMB        int  `json:"batch_size_in_mb"`
	MaxWorkerSize        int  `json:"max_worker_size"`
	IdleTimeoutInSeconds int  `json:"idle_timeout_in_seconds"`
	SliceSize            int  `json:"slice_size"`
	Compress             bool `json:"compress"`
	SkipExistDocuments   bool `json:"skip_exist_documents"`
}

type IndexMigrationTargetConfig struct {
	SkipCountCheck bool `json:"skip_count_check"`

	ClusterId string                   `json:"cluster_id"`
	Bulk      IndexMigrationBulkConfig `json:"bulk"`
}
