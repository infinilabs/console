package model

import "infini.sh/framework/core/task"

type Processor interface {
	Process(t *task.Task) (err error)
}
