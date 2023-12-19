package model

import (
	"fmt"
	"infini.sh/framework/core/task"
	"time"

	"infini.sh/framework/core/util"
)

type ExecutionConfig struct {
	TimeWindow []TimeWindowItem `json:"time_window"`
	Repeat     *Repeat          `json:"repeat"`
	Nodes      struct {
		Permit []ExecutionNode `json:"permit"`
	} `json:"nodes"`
}

type ExecutionNode struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Repeat struct {
	NextRunTime *time.Time    `json:"next_run_time"`
	Interval    time.Duration `json:"interval"`
	TotalRun    int64         `json:"total_run"`
}

type TimeWindowItem struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

type IndexPartition struct {
	FieldType string      `json:"field_type"`
	FieldName string      `json:"field_name"`
	Step      interface{} `json:"step"`
	//only worked when field type equals number
	UseEvenStrategy bool `json:"use_even_strategy"`
}

type IndexIncremental struct {
	FieldName string `json:"field_name"`
	// Optional, data ingest delay
	Delay time.Duration `json:"delay"`
	// If full, run the data from -inf, else from current - step
	Full bool `json:"full"`
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

// BuildFilter generate a query filter, used by split task
func (incremental *IndexIncremental) BuildFilter(current int64, step time.Duration) (util.MapStr, error) {
	if incremental == nil {
		return util.MapStr{}, nil
	}

	rv := util.MapStr{
		"lt":     int64(current) - incremental.Delay.Milliseconds(),
		"format": "epoch_millis",
	}
	if !incremental.Full {
		rv["gte"] = int64(current) - step.Milliseconds() - incremental.Delay.Milliseconds()
	}
	return util.MapStr{
		"range": util.MapStr{
			incremental.FieldName: rv,
		},
	}, nil
}

type QueryTask struct {
	Type string
	Status []string
	TaskHandler func(taskItem *task.Task) error
}