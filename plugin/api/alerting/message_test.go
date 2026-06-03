package alerting

import (
	"testing"
	"time"

	alertmodel "infini.sh/console/model/alerting"
)

func TestGetAlertDisplayState(t *testing.T) {
	alertItem := &alertmodel.Alert{State: alertmodel.AlertStateOK}
	if got := getAlertDisplayState(alertItem); got != alertmodel.AlertStateOK {
		t.Fatalf("expected ok, got %s", got)
	}

	alertItem.RecoverActionResults = []alertmodel.ActionExecutionResult{{ChannelType: "webhook"}}
	if got := getAlertDisplayState(alertItem); got != alertmodel.MessageStateRecovered {
		t.Fatalf("expected recovered, got %s", got)
	}
}

func TestBuildAlertMessageIncident(t *testing.T) {
	start := time.Unix(100, 0)
	resolve := start.Add(5 * time.Minute)
	message := &alertmodel.AlertMessage{
		Status: alertmodel.MessageStateRecovered,
	}
	alerts := []alertmodel.Alert{
		{ID: "alert-1", State: alertmodel.AlertStateAlerting, Created: start},
		{ID: "alert-2", State: alertmodel.AlertStateOK, Created: resolve},
		{
			ID:                   "alert-3",
			State:                alertmodel.AlertStateOK,
			Created:              start,
			Updated:              resolve,
			RecoverActionResults: []alertmodel.ActionExecutionResult{{ChannelType: "webhook"}},
		},
	}

	incident := buildAlertMessageIncident(message, alerts)
	if incident.TriggerEventID != "alert-1" {
		t.Fatalf("expected trigger alert-1, got %s", incident.TriggerEventID)
	}
	if incident.ResolveEventID != "alert-3" {
		t.Fatalf("expected resolve alert-3, got %s", incident.ResolveEventID)
	}
	if !incident.ResolveAt.Equal(resolve) {
		t.Fatalf("expected resolve time %v, got %v", resolve, incident.ResolveAt)
	}
}

func TestGetRecoveredAtPrefersRecoveredAt(t *testing.T) {
	recoveredAt := time.Unix(200, 0)
	updatedAt := recoveredAt.Add(-3 * time.Minute)
	message := &alertmodel.AlertMessage{
		Status:      alertmodel.MessageStateRecovered,
		Updated:     updatedAt,
		RecoveredAt: recoveredAt,
	}

	got := getRecoveredAt(message)
	if !got.Equal(recoveredAt) {
		t.Fatalf("expected recovered_at %v, got %v", recoveredAt, got)
	}
}
