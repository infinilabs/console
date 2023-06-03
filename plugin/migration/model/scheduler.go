package model

import (
	"errors"

	"infini.sh/console/model"
)

type Scheduler interface {
	GetPreferenceInstance(config ExecutionConfig) (instance *model.Instance, err error)
	GetInstance(instanceID string) (instance *model.Instance, err error)
	IncrInstanceJobs(instanceID string)
	DecrInstanceJobs(instanceID string)
	RefreshInstanceJobsFromES() error
}

var ErrHitMax = errors.New("instance hit max job limit")
