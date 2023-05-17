package model

import "infini.sh/framework/core/util"

// tunable `es_scroll` configurations
type EsScrollConfig struct {
	SliceSize int    `json:"slice_size"`
	Docs      int    `json:"docs"`
	Timeout   string `json:"timeout"`
}

// tunable `dump_hash` configurations
type DumpHashConfig struct {
	SliceSize     int    `json:"slice_size"`
	PartitionSize int    `json:"partition_size"`
	Docs          int    `json:"docs"`
	Timeout       string `json:"timeout"`
}

// tunable `index_diff` configurations
type IndexDiffConfig struct {
}

// tunable `bulk_indexing` configurations
type BulkIndexingConfig struct {
	Docs                 int  `json:"docs"`
	StoreSizeInMB        int  `json:"store_size_in_mb"`
	MaxWorkerSize        int  `json:"max_worker_size"`
	IdleTimeoutInSeconds int  `json:"idle_timeout_in_seconds"`
	SliceSize            int  `json:"slice_size"`
	Compress             bool `json:"compress"`
}

type PipelineTaskLoggingConfig struct {
	Enabled bool `json:"enabled"`
}

type PipelineTaskConfig struct {
	Name        string                    `json:"name"`
	Logging     PipelineTaskLoggingConfig `json:"logging"`
	Labels      util.MapStr               `json:"labels"`
	AutoStart   bool                      `json:"auto_start"`
	KeepRunning bool                      `json:"keep_running"`
	Processor   []util.MapStr             `json:"processor"`
}
