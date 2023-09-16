package model

import (
	"errors"
	"infini.sh/console/model"
)

type Scheduler interface {
	GetPreferenceInstance(config ExecutionConfig) (instance *model.TaskWorker, err error)
	GetInstance(instanceID string) (instance *model.TaskWorker, err error)
	IncrInstanceJobs(instanceID string)
	DecrInstanceJobs(instanceID string)
	RefreshInstanceJobsFromES() error
}

var ErrHitMax = errors.New("instance hit max job limit")
