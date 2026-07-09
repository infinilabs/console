package server

import (
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/security"
)

type memoryKVStore struct {
	lock sync.RWMutex
	data map[string]map[string][]byte
}

func newMemoryKVStore() *memoryKVStore {
	return &memoryKVStore{
		data: map[string]map[string][]byte{},
	}
}

func (m *memoryKVStore) Open() error  { return nil }
func (m *memoryKVStore) Close() error { return nil }

func (m *memoryKVStore) GetValue(bucket string, key []byte) ([]byte, error) {
	m.lock.RLock()
	defer m.lock.RUnlock()
	if m.data[bucket] == nil {
		return nil, nil
	}
	value := m.data[bucket][string(key)]
	if value == nil {
		return nil, nil
	}
	buf := make([]byte, len(value))
	copy(buf, value)
	return buf, nil
}

func (m *memoryKVStore) GetCompressedValue(bucket string, key []byte) ([]byte, error) {
	return m.GetValue(bucket, key)
}

func (m *memoryKVStore) AddValueCompress(bucket string, key []byte, value []byte) error {
	return m.AddValue(bucket, key, value)
}

func (m *memoryKVStore) AddValue(bucket string, key []byte, value []byte) error {
	m.lock.Lock()
	defer m.lock.Unlock()
	if m.data[bucket] == nil {
		m.data[bucket] = map[string][]byte{}
	}
	buf := make([]byte, len(value))
	copy(buf, value)
	m.data[bucket][string(key)] = buf
	return nil
}

func (m *memoryKVStore) ExistsKey(bucket string, key []byte) (bool, error) {
	m.lock.RLock()
	defer m.lock.RUnlock()
	if m.data[bucket] == nil {
		return false, nil
	}
	_, ok := m.data[bucket][string(key)]
	return ok, nil
}

func (m *memoryKVStore) DeleteKey(bucket string, key []byte) error {
	m.lock.Lock()
	defer m.lock.Unlock()
	if m.data[bucket] != nil {
		delete(m.data[bucket], string(key))
	}
	return nil
}

func TestMain(m *testing.M) {
	kv.Register("managed-server-register-token-test", newMemoryKVStore())
	os.Exit(m.Run())
}

func TestIssueBootstrapTokenCanBeValidated(t *testing.T) {
	token, err := issueBootstrapToken("user-1")
	if err != nil {
		t.Fatalf("issueBootstrapToken returned error: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty bootstrap token")
	}

	if err := validateBootstrapToken(token); err != nil {
		t.Fatalf("validateBootstrapToken returned error: %v", err)
	}
}

func TestValidateBootstrapTokenRejectsMissingOrUnknownToken(t *testing.T) {
	if err := validateBootstrapToken(""); err == nil || !strings.Contains(err.Error(), "required") {
		t.Fatalf("expected missing token error, got %v", err)
	}

	if err := validateBootstrapToken("missing-token"); err == nil || !strings.Contains(err.Error(), "invalid") {
		t.Fatalf("expected invalid token error, got %v", err)
	}
}

func TestGetBootstrapTokenUserIDReturnsOwner(t *testing.T) {
	token, err := issueBootstrapToken("user-2")
	if err != nil {
		t.Fatalf("issueBootstrapToken returned error: %v", err)
	}

	userID, err := getBootstrapTokenUserID(token)
	if err != nil {
		t.Fatalf("getBootstrapTokenUserID returned error: %v", err)
	}
	if userID != "user-2" {
		t.Fatalf("expected token owner user-2, got %q", userID)
	}
}

func TestValidateBootstrapTokenRejectsExpiredToken(t *testing.T) {
	user := &security.UserSessionInfo{
		Provider: "managed_agent",
		Login:    "user-3",
	}
	user.SetUserID("user-3")

	token, err := issueManagedAPIToken(
		user,
		"expired managed bootstrap",
		"managed_agent_bootstrap",
		time.Now().Add(-time.Minute).Unix(),
		getBootstrapTokenPermissions(),
	)
	if err != nil {
		t.Fatalf("failed to create expired bootstrap token: %v", err)
	}

	if err := validateBootstrapToken(token); err == nil || !strings.Contains(err.Error(), "expired") {
		t.Fatalf("expected expired token error, got %v", err)
	}
}

func TestValidateBootstrapTokenRejectsTokenWithoutRegisterPermission(t *testing.T) {
	user := &security.UserSessionInfo{
		Provider: "managed_agent",
		Login:    "user-4",
	}
	user.SetUserID("user-4")

	token, err := issueManagedAPIToken(
		user,
		"managed sync only",
		"managed_agent_sync",
		time.Now().Add(time.Hour).Unix(),
		[]security.PermissionKey{managedSyncPermission},
	)
	if err != nil {
		t.Fatalf("failed to create managed sync token: %v", err)
	}

	if err := validateBootstrapToken(token); err == nil || !strings.Contains(err.Error(), "invalid") {
		t.Fatalf("expected invalid token error, got %v", err)
	}
}
