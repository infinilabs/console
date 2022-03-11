package alerting

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"github.com/elastic/go-ucfg/yaml"
	cronlib "github.com/robfig/cron"
	"github.com/valyala/fasttemplate"
	"infini.sh/console/model/alerting"
	"infini.sh/console/service/alerting/action"
	util1 "infini.sh/console/service/alerting/util"
	"infini.sh/framework/core/conditions"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"io"
	"strings"
	"sync"
	"time"
)

var alertScheduler *scheduler
var alertSchedulerOnce = &sync.Once{}

func GetScheduler() *scheduler {
	alertSchedulerOnce.Do(func(){
		alertScheduler = NewScheduler()
	})
	return alertScheduler
}

func NewScheduler() *scheduler{
	cr := cronlib.New(cronlib.WithParser(cronlib.NewParser(
		cronlib.SecondOptional | cronlib.Minute | cronlib.Hour | cronlib.Dom | cronlib.Month | cronlib.Dow | cronlib.Descriptor,
	)))
	return &scheduler{
		cron: cr,
		mu: &sync.Mutex{},
	}
}

type scheduler struct{
	monitors sync.Map
	cron *cronlib.Cron
	IsStart bool
	mu *sync.Mutex
}

func (scd *scheduler) Start() error{
	scd.mu.Lock()
	if scd.IsStart {
		return nil
	}
	scd.mu.Unlock()
	monitors, err := getEnabledMonitors()
	if err != nil {
		return err
	}
	for id, monitor := range monitors {
		err = scd.AddMonitor(id, &monitor)
		if err != nil {
			return err
		}
		scd.monitors.Store(id, &monitor)
	}
	go scd.cron.Start()
	return nil
}

func (scd *scheduler) AddMonitor(key string, monitor *ScheduleMonitor) error{
	monitor.MonitorID = key
	if _, ok := scd.monitors.Load(key); ok {
		return errors.New("monitor already exists")
	}
	jobFunc := generateMonitorJob(monitor)
	var cron *alerting.Cron
	if monitor.Monitor.Schedule.Period != nil {
		cron = convertPeriodToCronExpression( monitor.Monitor.Schedule.Period)
	}
	if monitor.Monitor.Schedule.Cron != nil {
		cron = monitor.Monitor.Schedule.Cron
	}
	if cron != nil {
		timezone := ""
		if cron.Timezone != "" {
			timezone = fmt.Sprintf("CRON_TZ=%s ", cron.Timezone)
		}
		//fmt.Println(timezone + cron.Expression)
		entryID, err := scd.cron.AddFunc(timezone + cron.Expression, jobFunc)
		if err != nil {
			return  err
		}
		monitor.EntryID = entryID
	}
	scd.monitors.Store(key, monitor)
	return nil
}
func (scd *scheduler) Stop(){
	scd.monitors.Range(func (key, val interface{}) bool{
		monitor := val.(*ScheduleMonitor)
		scd.cron.Remove(monitor.EntryID)
		scd.monitors.Delete(key)
		return true
	})

}
func (scd *scheduler) RemoveMonitor(key string) bool{
	value, ok := scd.monitors.Load(key)
	if ok && value != nil {
		if monitor, ok := value.(*ScheduleMonitor); ok {
			scd.cron.Remove(monitor.EntryID)
			scd.monitors.Delete(key)
			return ok
		}
	}
	return ok
}

func (scd *scheduler) UpdateMonitor(key string, monitor *ScheduleMonitor) error{
	scd.RemoveMonitor(key)
	if monitor.Monitor.Enabled {
		return scd.AddMonitor(key, monitor)
	}
	return nil
}

func convertPeriodToCronExpression(period *alerting.Period) *alerting.Cron{
	var expression = "@every 1m"
	switch period.Unit {
	case "MINUTES":
		expression = fmt.Sprintf("@every %dm", period.Interval)
	case "HOURS":
		expression = fmt.Sprintf("@every %dh", period.Interval)
	case "DAYS":
		expression = fmt.Sprintf("@every %dh", period.Interval * 24)
	}
	return &alerting.Cron{
		Expression: expression,
		Timezone: "",
	}
}

type MonitorJob func()

func generateMonitorJob(smt *ScheduleMonitor) MonitorJob{
	sm := *smt
	return func() {
		startTime := time.Now()
		queryResult, err := getQueryResult(sm.ClusterID, &sm.Monitor.Inputs[0])
		if err != nil {
			log.Error(err)
		}
		periods := util1.GetMonitorPeriod(startTime, &sm.Monitor.Schedule)
		for _, trigger := range sm.Monitor.Triggers {
			monitorCtx, err := createMonitorContext(&trigger, queryResult, &sm, IfaceMap{
				"periodStart": periods.Start,
				"periodEnd": periods.End,
			})
			if err != nil {
				log.Error(err)
				continue
			}
			isTrigger, err := resolveTriggerResult(&trigger, monitorCtx)
			//fmt.Println("is triggered: ", isTrigger, err)
			if err != nil {
				log.Error(err)
				continue
			}
			alertItem := alerting.Alert{
				TriggerId: trigger.ID,
				TriggerName: trigger.Name,
				MonitorId: sm.MonitorID,
				MonitorName: sm.Monitor.Name,
				StartTime: time.Now().UnixNano()/1e6,
				Severity: trigger.Severity,
				State: ALERT_COMPLETED,
				ClusterID: sm.ClusterID,
				ClusterName: elastic.GetMetadata(sm.ClusterID).Config.Name,
			}
			if !isTrigger {
				endTime := time.Now().UnixNano()/1e6
				alertItem.EndTime = &endTime
				err = saveAlertInfo(&alertItem)
				if err != nil {
					log.Error(err)
				}
				continue
			}
			//check ack state
			lastAlert, err := getLastAlert(sm.MonitorID, trigger.ID, sm.ClusterID)
			if err != nil {
				log.Error(err)
				continue
			}
			if lastAlert != nil && lastAlert["state"].(string) == ALERT_ACKNOWLEDGED {
				continue
			}

			alertItem.State = ALERT_ACTIVE
			for _, act := range trigger.Actions {
				actResult, err := doAction(act, monitorCtx)
				var errMsg string
				if err != nil {
					errMsg =  err.Error()
					alertItem.ErrorMessage += errMsg
				}
				alertItem.ActionExecutionResults = append(alertItem.ActionExecutionResults, alerting.ActionExecutionResult{
					ActionID: act.ID,
					LastExecutionTime: alertItem.LastNotificationTime,
					Error: errMsg,
					Result: string(actResult),
				})
				alertItem.LastNotificationTime = time.Now().UnixNano()/1e6

				if alertItem.ErrorMessage != "" {
					alertItem.State = ALERT_ERROR
				}
				err = saveAlertInfo(&alertItem)
				if err != nil {
					log.Error(err)
				}
			}
		}
	}
}

func doAction(act alerting.Action, monitorCtx []byte) ([]byte, error) {
	message, err := resolveMessage(act.MessageTemplate, monitorCtx)
	if err != nil {
		//alertItem.ErrorMessage = err.Error()
		return nil, err
	}
	destination, err := resolveDestination(act.DestinationId)
	if err != nil {
		return nil, err
	}
	var tact action.Action

	switch destination.Type {
	case action.ACTION_EMAIL:
		sender, err := resolveEmailAccount(destination.Email.EmailAccountID)
		if err != nil {
			return nil, err
		}
		subject, err := resolveMessage(act.SubjectTemplate, monitorCtx)
		if err != nil {
			return nil, err
		}
		receiver, err := getEmailRecipient(destination.Email.Recipients)
		if err != nil {
			return nil, err
		}
		tact = &action.EmailAction{
			Message:  string(message),
			Subject:  string(subject),
			Sender:   sender,
			Receiver: receiver,
		}
	case action.ACTION_WEBHOOK:
		tact = &action.WebhookAction{
			Data:    &destination.CustomWebhook,
			Message: string(message),
		}
	default:
		return nil, fmt.Errorf("unsupported action type: %s", destination.Type)
	}
	return tact.Execute()
}


func getLastAlert(monitorID, triggerID, clusterID string) (map[string]interface{}, error) {
	conf := getDefaultConfig()
	esClient := elastic.GetClient(conf.ID)
	reqBody := IfaceMap{
		"size": 1,
		"query": IfaceMap{
			"bool": IfaceMap{
				"must": []IfaceMap{
					{
						"match": IfaceMap{
							"monitor_id": monitorID,
						},
					},
					{
						"match": IfaceMap{
							"cluster_id": clusterID,
						},
					},
					{
						"match": IfaceMap{
							"trigger_id": triggerID,
						},
					},
				},
			},

		},
		"sort": []IfaceMap{
			{"start_time": IfaceMap{"order":"desc"}},
		},
	}

	resBody, err := esClient.SearchWithRawQueryDSL(getAlertIndexName(INDEX_ALERT), util.MustToJSONBytes(reqBody))
	if err != nil {
		return nil, err
	}
	if len(resBody.Hits.Hits) > 0 {
		return resBody.Hits.Hits[0].Source, nil
	}
	return nil, nil
}

func saveAlertInfo(alertItem *alerting.Alert) error {
	conf := getDefaultConfig()
	esClient := elastic.GetClient(conf.ID)
	indexName := getAlertIndexName(INDEX_ALERT)
	reqBody := IfaceMap{
		"size": 1,
		"query": IfaceMap{
			"bool": IfaceMap{
				"must": []IfaceMap{
					{
						"match": IfaceMap{
							"monitor_id": alertItem.MonitorId,
						},
					},
					//{
					//	"match": IfaceMap{
					//		"state": ALERT_ACTIVE,
					//	},
					//},
					{
						"match": IfaceMap{
							"cluster_id": alertItem.ClusterID,
						},
					},
					{
						"match": IfaceMap{
							"trigger_id": alertItem.TriggerId,
						},
					},
				},
			},

		},
	}
	resBody, err := esClient.SearchWithRawQueryDSL(indexName, util.MustToJSONBytes(reqBody))
	if err != nil {
		return err
	}
	if len(resBody.Hits.Hits) == 0 {
		if alertItem.State == ALERT_COMPLETED {
			return nil
		}
		_, err = esClient.Index(indexName,"", util.GetUUID(), alertItem)
		return err
	}
	currentState := queryValue(resBody.Hits.Hits[0].Source, "state", "").(string)
	alertItem.Id = resBody.Hits.Hits[0].ID
	if currentState != alertItem.State {
		source := resBody.Hits.Hits[0].Source
		source["end_time"] = time.Now().UnixNano()/1e6
		if alertItem.State == ALERT_COMPLETED {
			if currentState == ALERT_ACTIVE {
				source["state"] = ALERT_COMPLETED
			}
		}
		esClient.Index( getAlertIndexName(INDEX_ALERT_HISTORY), "", alertItem.Id, source)
		_,err = esClient.Delete(indexName, "", resBody.Hits.Hits[0].ID)
		return err
	}
	alertItem.StartTime = int64(queryValue(resBody.Hits.Hits[0].Source, "start_time", 0).(float64))

	_, err = esClient.Index(indexName, "", alertItem.Id, alertItem )
	return err
}

func getEmailRecipient(recipients []alerting.Recipient) ([]string, error){
	var emails []string
	for _, recipient := range recipients {
		if recipient.Type == "email" {
			emails = append(emails, recipient.Email)
			continue
		}
		if recipient.Type == "email_group" {
			eg, err := resolveEmailGroup(recipient.EmailGroupID)
			if err != nil {
				return emails, err
			}
			for _, em := range eg.Emails {
				if email, ok := em["email"].(string); ok {
					emails = append(emails, email)
				}
			}
		}
	}
	return emails, nil
}

func resolveDestination(ID string)(*alerting.Destination, error){
	conf := getDefaultConfig()
	esClient := elastic.GetClient(conf.ID)
	res, err := esClient.Get( orm.GetIndexName(alerting.Config{}), "", ID)
	if err != nil {
		return nil,err
	}
	destination := &alerting.Destination{}
	buf, _ := json.Marshal(queryValue(res.Source, DESTINATION_FIELD, IfaceMap{}))
	_ = json.Unmarshal(buf, destination)
	return destination, nil
}

func resolveEmailAccount(ID string)(*alerting.EmailAccount, error){
	conf := getDefaultConfig()
	esClient := elastic.GetClient(conf.ID)
	res, err := esClient.Get( orm.GetIndexName(alerting.Config{}), "", ID)
	if err != nil {
		return nil,err
	}
	email := &alerting.EmailAccount{}
	buf, _ := json.Marshal(queryValue(res.Source, EMAIL_ACCOUNT_FIELD, IfaceMap{}))
	_ = json.Unmarshal(buf, email)
	return email, nil
}

func resolveEmailGroup(ID string)(*alerting.EmailGroup, error){
	conf := getDefaultConfig()
	esClient := elastic.GetClient(conf.ID)
	res, err := esClient.Get( orm.GetIndexName(alerting.Config{}), "", ID)
	if err != nil {
		return nil,err
	}

	emailGroup := &alerting.EmailGroup{}
	buf, _ := json.Marshal(queryValue(res.Source, EMAIL_GROUP_FIELD, IfaceMap{}))
	err = json.Unmarshal(buf, emailGroup)
	return emailGroup, err
}

func getQueryResult(clusterID string, input *alerting.MonitorInput) (IfaceMap, error) {
	esClient := elastic.GetClient(clusterID)
	queryDsl := util.MustToJSONBytes(input.Search.Query)
	searchRes, err := esClient.SearchWithRawQueryDSL(strings.Join(input.Search.Indices, ","), queryDsl)
	if err != nil {
		return nil, err
	}
	var resBody = IfaceMap{}
	util.MustFromJSONBytes(searchRes.RawResult.Body, &resBody)
	return resBody, nil
}

func resolveMessage(messageTemplate IfaceMap, monitorCtx []byte ) ([]byte, error){
	msg :=  messageTemplate["source"].(string)
	tpl := fasttemplate.New(msg, "{{", "}}")
	msgBuffer := bytes.NewBuffer(nil)
	_, err := tpl.ExecuteFunc(msgBuffer, func(writer io.Writer, tag string)(int, error){
		keyParts := strings.Split(tag,".")
		value, _, _, err := jsonparser.Get(monitorCtx, keyParts...)
		if err != nil {
			return 0, err
		}
		return writer.Write(value)
	})
	return msgBuffer.Bytes(), err
	//return json.Marshal(msg)
}

func createMonitorContext(trigger *alerting.Trigger, result IfaceMap, smt *ScheduleMonitor, extra IfaceMap) ([]byte, error){
	params := IfaceMap{
		"results": []interface{}{
			result,
		},
		"trigger": trigger,
		"monitor": smt.Monitor,
		"cluster_id": smt.ClusterID,
	}
	assignTo(params, extra)
	ctx := IfaceMap{
		"_ctx": params,
	}
	return json.Marshal(ctx)
}

func resolveTriggerResult(trigger *alerting.Trigger, monitorCtx []byte ) (bool, error){
	source := queryValue(trigger.Condition, "script.source", "")
	sourceBytes := []byte(source.(string))
	config, err := yaml.NewConfig(sourceBytes)
	if err != nil {
		return false, err
	}
	var boolConfig = &conditions.Config{}
	err = config.Unpack(boolConfig)
	if err != nil {
		return false, err
	}

	cond, err := conditions.NewCondition(boolConfig)
	if err != nil {
		return false, err
	}

	ev := &MonitorEvent{
		Fields: monitorCtx,
	}
	return cond.Check(ev), nil
}

func getEnabledMonitors() (map[string]ScheduleMonitor, error){
	config := getDefaultConfig()
	esClient := elastic.GetClient(config.ID)
	must := []IfaceMap{
		{
			"exists": IfaceMap{
				"field": MONITOR_FIELD,
			},
		},
		{
			"match": IfaceMap{
				MONITOR_FIELD+".enabled": true,
			},
		},
	}
	reqBody := IfaceMap{
		"size": 100,
		"query": IfaceMap{
			"bool": IfaceMap{
				"must": must,
				"must_not": []IfaceMap{
					{
						"match": IfaceMap{
							MONITOR_FIELD+".status": "DELETED",
						},
					},
				},
			},
		},
	}
	queryDsl := util.MustToJSONBytes(reqBody)
	resBody, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(alerting.Config{}),queryDsl)
	if err != nil {
		return nil, err
	}
	if len(resBody.Hits.Hits) == 0 {
		return nil, nil
	}
	var monitors = map[string]ScheduleMonitor{}
	for _, hit := range resBody.Hits.Hits {
		monitor := &alerting.Monitor{}
		buf, _ := json.Marshal(hit.Source[MONITOR_FIELD])
		_ = json.Unmarshal(buf, monitor)
		monitors[hit.ID] = ScheduleMonitor{
			Monitor: monitor,
			ClusterID: hit.Source["cluster_id"].(string),
		}
	}

	return monitors, nil
}

type ScheduleMonitor struct {
	Monitor *alerting.Monitor
	ClusterID string
	EntryID cronlib.EntryID
	MonitorID string
}