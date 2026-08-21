package security

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	api2 "infini.sh/framework/core/api"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
)

func TestConsoleTrialLicenseRouteAcceptsConsoleTokenAndForwardsQuery(t *testing.T) {
	registerFrameworkAccountBridge()
	registerConsoleLicenseTrialBridge()

	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	originalRemote := requestConsoleTrialLicenseRemotely
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
		requestConsoleTrialLicenseRemotely = originalRemote
	})

	global.Env().SystemConfig.WebAppConfig.Security.Enabled = true

	var requestedURL string
	requestConsoleTrialLicenseRemotely = func(url string, body []byte) (*util.Result, error) {
		requestedURL = url
		if !bytes.Contains(body, []byte(`"product":"console"`)) {
			t.Fatalf("expected forwarded body to keep product field, got %s", string(body))
		}
		return &util.Result{
			StatusCode: http.StatusOK,
			Body:       []byte(`{"acknowledged":true}`),
		}, nil
	}

	webCfg := config.WebAppConfig{}
	webCfg.NetworkConfig.Binding = newBridgeTestBinding(t)

	api2.StartWeb(webCfg)
	defer api2.StopWeb(webCfg)

	req := httptest.NewRequest(http.MethodPost, "/_license/request_trial?lang=zh-CN", bytes.NewBufferString(`{"product":"console","email":"user@example.org"}`))
	req.Header.Set("Authorization", "Bearer "+issueConsoleBridgeTestToken(t, "bridge-admin"))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
		t.Fatalf("serve console trial route: %v", err)
	}
	if resp.Code != http.StatusOK {
		t.Fatalf("expected console trial route to return 200, got %d: %s", resp.Code, resp.Body.String())
	}
	if requestedURL != "https://api.infini.cloud/_license/request_trial?lang=zh-CN" {
		t.Fatalf("expected lang query to be forwarded, got %s", requestedURL)
	}
}
