package security

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	rbac "infini.sh/console/core/security"
	api2 "infini.sh/framework/core/api"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/global"
	frameworksecurity "infini.sh/framework/core/security"

	"github.com/golang-jwt/jwt/v4"

	_ "infini.sh/console/modules/security/filter"
	_ "infini.sh/framework/modules/security/http_filters"
	_ "infini.sh/license"
)

func TestFrameworkAccountBridgeAcceptsConsoleBearerToken(t *testing.T) {
	registerFrameworkAccountBridge()

	req := httptest.NewRequest("GET", "/account/profile", nil)
	req.Header.Set("Authorization", "Bearer "+issueConsoleBridgeTestToken(t, "bridge-user"))
	resp := httptest.NewRecorder()

	sessionUser, err := frameworksecurity.ValidateLogin(resp, req)
	if err != nil {
		t.Fatalf("expected console bearer token to validate through framework bridge, got %v", err)
	}
	if sessionUser == nil || sessionUser.UserID != "bridge-user" {
		t.Fatalf("unexpected bridged session user: %#v", sessionUser)
	}
	if sessionUser.Provider != frameworksecurity.DefaultNativeAuthBackend {
		t.Fatalf("expected bridged provider %q, got %q", frameworksecurity.DefaultNativeAuthBackend, sessionUser.Provider)
	}
}

func TestFrameworkLicenseUIRouteAcceptsConsoleAdminToken(t *testing.T) {
	registerFrameworkAccountBridge()

	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	global.Env().SystemConfig.WebAppConfig.Security.Enabled = true

	webCfg := config.WebAppConfig{}
	webCfg.NetworkConfig.Binding = "127.0.0.1:0"

	api2.StartWeb(webCfg)
	defer api2.StopWeb(webCfg)

	req := httptest.NewRequest(http.MethodGet, "/_license/info", nil)
	req.Header.Set("Authorization", "Bearer "+issueConsoleBridgeTestToken(t, "bridge-admin"))
	resp := httptest.NewRecorder()

	if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
		t.Fatalf("serve framework license ui route: %v", err)
	}
	if resp.Code != http.StatusOK {
		t.Fatalf("expected framework /_license/info ui route to accept console admin token, got %d", resp.Code)
	}
}

func issueConsoleBridgeTestToken(t *testing.T, userID string) string {
	t.Helper()

	expireAt := time.Now().Add(time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, rbac.UserClaims{
		ShortUser: &rbac.ShortUser{
			Provider: "native",
			Username: "tester",
			UserId:   userID,
			Roles:    []string{"Administrator"},
		},
		RegisteredClaims: &jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expireAt),
		},
	})

	tokenString, err := token.SignedString([]byte(rbac.Secret))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}

	rbac.SetUserToken(userID, rbac.Token{
		Value:    tokenString,
		ExpireIn: expireAt.Unix(),
	})
	t.Cleanup(func() {
		rbac.DeleteUserToken(userID)
	})

	return tokenString
}
