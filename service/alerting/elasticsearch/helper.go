/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package elasticsearch

import (
	"fmt"
	"infini.sh/console/model/alerting"
	"infini.sh/framework/core/orm"
)

func RetrieveChannel(ch *alerting.Channel) (*alerting.Channel, error) {
	if ch == nil {
		return nil, fmt.Errorf("empty channel")
	}
	if ch.ID != "" {
		_, err := orm.Get(ch)
		if err != nil {
			return nil, err
		}
	}
	return ch, nil
}
