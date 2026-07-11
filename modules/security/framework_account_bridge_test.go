package security

import (
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	rbac "infini.sh/console/core/security"
	api2 "infini.sh/framework/core/api"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/orm"
	frameworksecurity "infini.sh/framework/core/security"

	"github.com/golang-jwt/jwt/v4"

	_ "infini.sh/console/modules/security/filter"
	_ "infini.sh/framework/modules/security/http_filters"
	"infini.sh/license"
)

type bridgeTestMemoryKVStore struct {
	values map[string][]byte
}

func (m *bridgeTestMemoryKVStore) Open() error { return nil }

func (m *bridgeTestMemoryKVStore) Close() error { return nil }

func (m *bridgeTestMemoryKVStore) GetValue(bucket string, key []byte) ([]byte, error) {
	value, ok := m.values[fmt.Sprintf("%s:%s", bucket, string(key))]
	if !ok {
		return nil, nil
	}
	return value, nil
}

func (m *bridgeTestMemoryKVStore) GetCompressedValue(bucket string, key []byte) ([]byte, error) {
	return m.GetValue(bucket, key)
}

func (m *bridgeTestMemoryKVStore) AddValueCompress(bucket string, key []byte, value []byte) error {
	return m.AddValue(bucket, key, value)
}

func (m *bridgeTestMemoryKVStore) AddValueCompressWithTTL(bucket string, key []byte, value []byte, _ time.Duration) error {
	return m.AddValue(bucket, key, value)
}

func (m *bridgeTestMemoryKVStore) AddValue(bucket string, key []byte, value []byte) error {
	m.values[fmt.Sprintf("%s:%s", bucket, string(key))] = value
	return nil
}

func (m *bridgeTestMemoryKVStore) AddValueWithTTL(bucket string, key []byte, value []byte, _ time.Duration) error {
	return m.AddValue(bucket, key, value)
}

func (m *bridgeTestMemoryKVStore) ExistsKey(bucket string, key []byte) (bool, error) {
	_, ok := m.values[fmt.Sprintf("%s:%s", bucket, string(key))]
	return ok, nil
}

func (m *bridgeTestMemoryKVStore) DeleteKey(bucket string, key []byte) error {
	delete(m.values, fmt.Sprintf("%s:%s", bucket, string(key)))
	return nil
}

var registerBridgeTestKVOnce sync.Once

func ensureBridgeTestKVStore() {
	registerBridgeTestKVOnce.Do(func() {
		kv.Register("framework-account-bridge-test", &bridgeTestMemoryKVStore{
			values: map[string][]byte{},
		})
	})
}

func newBridgeTestBinding(t *testing.T) string {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen on random port: %v", err)
	}
	defer listener.Close()

	return listener.Addr().String()
}

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
	license.Init()

	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	global.Env().SystemConfig.WebAppConfig.Security.Enabled = true

	webCfg := config.WebAppConfig{}
	webCfg.NetworkConfig.Binding = newBridgeTestBinding(t)

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

func TestFrameworkLicenseUIRouteAcceptsConsoleReadonlyToken(t *testing.T) {
	registerFrameworkAccountBridge()
	license.Init()

	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	global.Env().SystemConfig.WebAppConfig.Security.Enabled = true

	webCfg := config.WebAppConfig{}
	webCfg.NetworkConfig.Binding = newBridgeTestBinding(t)

	api2.StartWeb(webCfg)
	defer api2.StopWeb(webCfg)

	req := httptest.NewRequest(http.MethodGet, "/_license/info", nil)
	req.Header.Set("Authorization", "Bearer "+issueConsoleBridgeTestToken(t, "bridge-readonly", "readonly"))
	resp := httptest.NewRecorder()

	if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
		t.Fatalf("serve framework license ui route: %v", err)
	}
	if resp.Code != http.StatusOK {
		t.Fatalf("expected framework /_license/info ui route to accept console readonly token, got %d", resp.Code)
	}
}

func issueConsoleBridgeTestToken(t *testing.T, userID string, roles ...string) string {
	t.Helper()

	ensureBridgeTestKVStore()

	expireAt := time.Now().Add(time.Hour)
	if len(roles) == 0 {
		roles = []string{"Administrator"}
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, rbac.UserClaims{
		ShortUser: &rbac.ShortUser{
			Provider: "native",
			Username: "tester",
			UserId:   userID,
			Roles:    roles,
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

type bridgeTestUserStore struct {
	items map[string]rbac.User
}

func (s *bridgeTestUserStore) Get(id string) (rbac.User, error) {
	if user, ok := s.items[id]; ok {
		return user, nil
	}
	return rbac.User{}, nil
}

func (s *bridgeTestUserStore) GetBy(field string, value interface{}) (*rbac.User, error) {
	return nil, nil
}

func (s *bridgeTestUserStore) Update(user *rbac.User) error {
	if user == nil {
		return nil
	}
	s.items[user.ID] = *user
	return nil
}

func (s *bridgeTestUserStore) Create(user *rbac.User) (string, error) {
	return "", nil
}

func (s *bridgeTestUserStore) Delete(id string) error {
	return nil
}

func (s *bridgeTestUserStore) Search(keyword string, from, size int) (orm.Result, error) {
	return orm.Result{}, nil
}

func TestPersistFrameworkChallengeUpgradeUpdatesLegacyUserCredentials(t *testing.T) {
	store := &bridgeTestUserStore{
		items: map[string]rbac.User{
			"default_user_admin": {
				ORMObjectBase: orm.ORMObjectBase{ID: "default_user_admin"},
				Password:      "legacy-hash",
			},
		},
	}
	adapter := rbac.Adapter{User: store}
	user := &frameworksecurity.UserAccount{
		PasswordSalt:     "new-salt",
		PasswordVerifier: "new-verifier",
	}
	user.ID = "default_user_admin"

	if err := persistFrameworkChallengeUpgrade(adapter, user); err != nil {
		t.Fatalf("expected challenge upgrade persistence to succeed, got %v", err)
	}
	updated := store.items["default_user_admin"]
	if updated.PasswordSalt != "new-salt" {
		t.Fatalf("expected password_salt to be updated, got %q", updated.PasswordSalt)
	}
	if updated.PasswordVerifier != "new-verifier" {
		t.Fatalf("expected password_verifier to be updated, got %q", updated.PasswordVerifier)
	}
}

func TestPersistFrameworkChallengeUpgradeSkipsMissingUserID(t *testing.T) {
	store := &bridgeTestUserStore{items: map[string]rbac.User{}}
	adapter := rbac.Adapter{User: store}

	if err := persistFrameworkChallengeUpgrade(adapter, &frameworksecurity.UserAccount{}); err != nil {
		t.Fatalf("expected empty user id to be ignored, got %v", err)
	}
}

func TestFrameworkNativeAccountProviderFallsBackToPlainForExternalRealm(t *testing.T) {
	originalHasNonNativeRealm := hasNonNativeRealm
	hasNonNativeRealm = func() bool { return true }
	t.Cleanup(func() {
		hasNonNativeRealm = originalHasNonNativeRealm
	})

	store := &bridgeTestUserStore{items: map[string]rbac.User{}}
	provider := frameworkNativeAccountProvider{
		adapter: rbac.Adapter{User: store},
	}

	exists, account, err := provider.GetUserByLogin("ldap-user")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !exists {
		t.Fatal("expected external realm fallback account to exist")
	}
	if account == nil || account.Name != "ldap-user" {
		t.Fatalf("unexpected fallback account: %#v", account)
	}
	if account.ID != "" {
		t.Fatalf("expected fallback account id to be empty, got %q", account.ID)
	}
}

func TestFrameworkNativeAccountProviderNoFallbackWithoutExternalRealm(t *testing.T) {
	originalHasNonNativeRealm := hasNonNativeRealm
	hasNonNativeRealm = func() bool { return false }
	t.Cleanup(func() {
		hasNonNativeRealm = originalHasNonNativeRealm
	})

	store := &bridgeTestUserStore{items: map[string]rbac.User{}}
	provider := frameworkNativeAccountProvider{
		adapter: rbac.Adapter{User: store},
	}

	exists, account, err := provider.GetUserByLogin("unknown-user")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if exists {
		t.Fatal("expected unknown user without external realm fallback to not exist")
	}
	if account != nil {
		t.Fatalf("expected nil account, got %#v", account)
	}
}
