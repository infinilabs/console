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
	"infini.sh/framework/core/conditions"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/search-center/model/alerting"
	"infini.sh/search-center/service/alerting/action"
	"io"
	"net/http"
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
		queryResult, err := getQueryResult(sm.ClusterID, &sm.Monitor.Inputs[0])
		if err != nil {
			log.Error(err)
		}
		for _, trigger := range sm.Monitor.Triggers {
			monitorCtx, err := createMonitorContext(&trigger, queryResult, &sm, IfaceMap{})
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
				message, err := resolveMessage(act.MessageTemplate, monitorCtx)
				if err != nil {
					alertItem.ErrorMessage = err.Error()
					continue
				}
				destination, err := resolveDestination(act.DestinationId)
				if err != nil {
					alertItem.ErrorMessage = err.Error()
					continue
				}
				var tact action.Action
				alertItem.LastNotificationTime = time.Now().UnixNano()/1e6
				switch destination.Type {
					case action.ACTION_EMAIL:
						sender, err := resolveEmailAccount(destination.Email.EmailAccountID)
						if err != nil {
							alertItem.ErrorMessage = err.Error()
							continue
						}
						subject, err := resolveMessage(act.SubjectTemplate, monitorCtx)
						if err != nil {
							alertItem.ErrorMessage = err.Error()
							continue
						}
						receiver, err := getEmailRecipient(destination.Email.Recipients)
						if err != nil {
							alertItem.ErrorMessage = err.Error()
							continue
						}
						tact = &action.EmailAction{
							Message: string(message),
							Subject: string(subject),
							Sender: sender,
							Receiver: receiver,
						}
				case action.ACTION_WEBHOOK:
					tact = &action.WebhookAction{
						Data: &destination.CustomWebhook,
						Message: string(message),
					}
				}
				if tact != nil {
					actResult, err := tact.Execute()
					var errStr string
					if err != nil {
						errStr = err.Error()
						alertItem.ErrorMessage += errStr
					}
					alertItem.ActionExecutionResults = append(alertItem.ActionExecutionResults, alerting.ActionExecutionResult{
						ActionID: act.ID,
						LastExecutionTime: alertItem.LastNotificationTime,
						Error: errStr,
						Result: string(actResult),
					})

				}
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


func getLastAlert(monitorID, triggerID, clusterID string) (map[string]interface{}, error) {
	conf := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_search", conf.Endpoint, getAlertIndexName(INDEX_ALERT))
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
	res, err := doRequest(reqUrl, http.MethodGet, nil, reqBody)
	if err != nil {
		return nil, err
	}
	var resBody = &elastic.SearchResponse{}
	err = decodeJSON(res.Body, resBody)
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
	indexName := getAlertIndexName(INDEX_ALERT)
	reqUrl := fmt.Sprintf("%s/%s/_search", conf.Endpoint, indexName)
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
	res, err := doRequest(reqUrl, http.MethodGet, nil, reqBody)
	if err != nil {
		return err
	}
	var resBody = elastic.SearchResponse{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		return  err
	}
	res.Body.Close()
	if len(resBody.Hits.Hits) == 0 {
		if alertItem.State == ALERT_COMPLETED {
			return nil
		}
		reqUrl = fmt.Sprintf("%s/%s/_doc", conf.Endpoint, indexName)
		_,err = doRequest(reqUrl, http.MethodPost, nil,  alertItem)
		return err
	}
	currentState := queryValue(resBody.Hits.Hits[0].Source, "state", "").(string)
	alertItem.Id = resBody.Hits.Hits[0].ID.(string)
	if currentState != alertItem.State {
		reqUrl = fmt.Sprintf("%s/%s/_doc/%s", conf.Endpoint, getAlertIndexName(INDEX_ALERT_HISTORY), alertItem.Id)
		source := resBody.Hits.Hits[0].Source
		source["end_time"] = time.Now().UnixNano()/1e6
		if alertItem.State == ALERT_COMPLETED {
			if currentState == ALERT_ACTIVE {
				source["state"] = ALERT_COMPLETED
			}
		}
		_,err = doRequest(reqUrl, http.MethodPut, nil, source)
		reqUrl = fmt.Sprintf("%s/%s/_doc/%s", conf.Endpoint, indexName, resBody.Hits.Hits[0].ID.(string))
		_,err = doRequest(reqUrl, http.MethodDelete, nil,   alertItem)
		return err
	}
	alertItem.StartTime = int64(queryValue(resBody.Hits.Hits[0].Source, "start_time", 0).(float64))

	reqUrl = fmt.Sprintf("%s/%s/_doc/%s", conf.Endpoint, indexName, alertItem.Id)
	_,err = doRequest(reqUrl, http.MethodPut, nil,  alertItem)
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
	//todo may be cache destination ?
	conf := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", conf.Endpoint, orm.GetIndexName(alerting.Config{}), ID)
	res, err := doRequest(reqUrl, http.MethodGet, nil, nil)
	if err != nil {
		return nil,err
	}
	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		return nil, err
	}
	res.Body.Close()
	destination := &alerting.Destination{}
	buf, _ := json.Marshal(queryValue(resBody, "_source."+DESTINATION_FIELD, IfaceMap{}))
	_ = json.Unmarshal(buf, destination)
	return destination, nil
}

func resolveEmailAccount(ID string)(*alerting.EmailAccount, error){
	conf := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", conf.Endpoint, orm.GetIndexName(alerting.Config{}), ID)
	res, err := doRequest(reqUrl, http.MethodGet, nil, nil)
	if err != nil {
		return nil,err
	}
	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		return nil, err
	}
	res.Body.Close()
	email := &alerting.EmailAccount{}
	buf, _ := json.Marshal(queryValue(resBody, "_source."+EMAIL_ACCOUNT_FIELD, IfaceMap{}))
	_ = json.Unmarshal(buf, email)
	return email, nil
}

func resolveEmailGroup(ID string)(*alerting.EmailGroup, error){
	conf := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", conf.Endpoint, orm.GetIndexName(alerting.Config{}), ID)
	res, err := doRequest(reqUrl, http.MethodGet, nil, nil)
	if err != nil {
		return nil,err
	}
	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		return nil, err
	}
	res.Body.Close()
	emailGroup := &alerting.EmailGroup{}
	buf, _ := json.Marshal(queryValue(resBody, "_source."+EMAIL_GROUP_FIELD, IfaceMap{}))
	_ = json.Unmarshal(buf, emailGroup)
	return emailGroup, nil
}

func getQueryResult(clusterID string, input *alerting.MonitorInput) (IfaceMap, error) {
	meta := elastic.GetMetadata(clusterID)
	reqUrl := fmt.Sprintf("%s/%s/_search", meta.GetActiveEndpoint(), strings.Join(input.Search.Indices, ","))
	res, err := doRequest(reqUrl, http.MethodGet, nil, input.Search.Query)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	resBody := IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	return resBody, err
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
	ctx := IfaceMap{
		"_ctx": IfaceMap{
			"results": []interface{}{
				result,
			},
			"trigger": trigger,
			"monitor": smt.Monitor,
			"cluster_id": smt.ClusterID,
			"periodStart": "",
			"periodEnd":"",
		},
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
	reqUrl := fmt.Sprintf("%s/%s/_search", config.Endpoint, orm.GetIndexName(alerting.Config{}))
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
			},
		},
	}
	resBody := elastic.SearchResponse{}
	res, err := doRequest(reqUrl, http.MethodGet, nil, reqBody)
	if err != nil {
		return nil, err
	}
	err = decodeJSON(res.Body, &resBody)
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
		monitors[hit.ID.(string)] = ScheduleMonitor{
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