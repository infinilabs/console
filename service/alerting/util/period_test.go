package util

import (
	"fmt"
	"infini.sh/search-center/model/alerting"
	"testing"
	"time"
)

func TestGetMonitorPeriod(t *testing.T) {
	now := time.Now()
	periods := GetMonitorPeriod(&now, &alerting.Schedule{
		Cron: &alerting.Cron{
			Expression: "0 0 1 */1 *",
		},
		//Period: &alerting.Period{
		//	Unit: "MINUTES",
		//	Interval: 10,
		//},
	})
	fmt.Println(periods)
}