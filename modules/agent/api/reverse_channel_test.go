package api

import (
	"net/http/httptest"
	"testing"

	"infini.sh/framework/core/model"
)

func TestAgentReverseChannelOnConnectAllowsGenericWebsocket(t *testing.T) {
	req := httptest.NewRequest("GET", "/ws", nil)

	if err := onAgentReverseConnect("session-1", nil, req); err != nil {
		t.Fatalf("expected generic websocket connection to pass, got %v", err)
	}
}

func TestShouldUseReverseChannelOnlyForInstance(t *testing.T) {
	cases := []struct {
		name     string
		instance *model.Instance
		expect   bool
	}{
		{
			name:   "nil instance",
			expect: false,
		},
		{
			name: "empty labels",
			instance: &model.Instance{
				Labels: map[string]string{},
			},
			expect: false,
		},
		{
			name: "marker enabled",
			instance: &model.Instance{
				Labels: map[string]string{
					reverseChannelRegistrationLabelKey: reverseChannelRegistrationLabelValue,
				},
			},
			expect: true,
		},
		{
			name: "marker mixed case",
			instance: &model.Instance{
				Labels: map[string]string{
					reverseChannelRegistrationLabelKey: "TRUE",
				},
			},
			expect: true,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := shouldUseReverseChannelOnlyForInstance(tc.instance); got != tc.expect {
				t.Fatalf("unexpected reverse-only result, got=%v want=%v", got, tc.expect)
			}
		})
	}
}
