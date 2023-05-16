package model

import "infini.sh/framework/core/util"

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
