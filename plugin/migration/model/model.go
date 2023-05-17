/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package model

import (
	"infini.sh/framework/core/util"
)

type ClusterMigrationTaskConfig struct {
	Cluster struct {
		Source ClusterInfo `json:"source"`
		Target ClusterInfo `json:"target"`
	} `json:"cluster"`
	Indices  []ClusterMigrationIndexConfig `json:"indices"`
	Settings struct {
		Scroll    EsScrollConfig     `json:"scroll"`
		Bulk      BulkIndexingConfig `json:"bulk"`
		Execution ExecutionConfig    `json:"execution"`
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
	Partition   *IndexPartition        `json:"partition,omitempty"`

	// only used in API
	Percent         float64 `json:"percent,omitempty"`
	ErrorPartitions int     `json:"error_partitions,omitempty"`
}

type MajorTaskState struct {
	IndexDocs int64
	Status    string
}

type IndexStateInfo struct {
	ErrorPartitions int
	IndexDocs       float64
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
	ClusterId   string      `json:"cluster_id"`
	Indices     string      `json:"indices"`
	SliceSize   int         `json:"slice_size"`
	BatchSize   int         `json:"batch_size"`
	ScrollTime  string      `json:"scroll_time"`
	IndexRename util.MapStr `json:"index_rename,omitempty"`
	TypeRename  util.MapStr `json:"type_rename,omitempty"`
	QueryString string      `json:"query_string,omitempty"`
	QueryDSL    util.MapStr `json:"query_dsl,omitempty"`

	// Parition configs
	Start       float64     `json:"start"`
	End         float64     `json:"end"`
	DocCount    int64       `json:"doc_count"`
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
}

type IndexMigrationTargetConfig struct {
	ClusterId string                   `json:"cluster_id"`
	Bulk      IndexMigrationBulkConfig `json:"bulk"`
}
