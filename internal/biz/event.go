package biz

import (
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/util"
	"time"
)

func GenerateEvent(metadata event.ActivityMetadata, fields util.MapStr, changeLog interface{}) *event.Activity {
	return &event.Activity{
		ID:        util.GetUUID(),
		Timestamp: time.Now(),
		Metadata:  metadata,
		Fields:    fields,
		Changelog: changeLog,
	}

}
