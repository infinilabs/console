package util

import (
	"fmt"
	cronlib "github.com/robfig/cron"
	"infini.sh/search-center/model/alerting"
	"time"
)

type MonitorPeriod struct {
	Start time.Time
	End time.Time
}

func GetMonitorPeriod(currentTime time.Time, schedule *alerting.Schedule) *MonitorPeriod{
	if schedule.Period != nil {
		return transformPeriod(currentTime, schedule.Period)
	}
	if schedule.Cron != nil {
		return transformCron(currentTime, schedule.Cron)
	}
	return nil
}


func transformCron(currentTime time.Time, cron *alerting.Cron) *MonitorPeriod {
	timezone := ""
	if cron.Timezone != "" {
		timezone = fmt.Sprintf("CRON_TZ=%s ", cron.Timezone)
	}

	parser := cronlib.NewParser(
		cronlib.SecondOptional | cronlib.Minute | cronlib.Hour | cronlib.Dom | cronlib.Month | cronlib.Dow,
	)

	sd, _ := parser.Parse(timezone + cron.Expression)
	ssd := sd.(*cronlib.SpecSchedule)
	var duration = time.Minute
	if ssd.Hour == 1 {
		duration = time.Hour
	}
	tempTime := currentTime
	nextTime := sd.Next(tempTime)
	var preTime = tempTime
	for {
		tempTime = tempTime.Add(-duration)
		if preTime = sd.Next(tempTime); !preTime.Equal(nextTime) {
			break
		}
	}
	mp := &MonitorPeriod{
		Start: preTime,
		End: currentTime,
	}
	return mp
}

func transformPeriod(currentTime time.Time, period *alerting.Period) *MonitorPeriod {
	if period == nil {
		return nil
	}
	mp := &MonitorPeriod{
		End: currentTime,
	}
	var duration time.Duration
	switch period.Unit {
	case "MINUTES":
		duration = time.Minute
	case "HOURS":
		duration = time.Hour
	case "DAYS":
		duration = time.Hour * 24
	default:
		return nil
	}
	mp.Start = currentTime.Add(-duration * time.Duration(period.Interval))
	return mp
}