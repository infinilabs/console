package security

import (
	"fmt"
	"infini.sh/framework/core/kv"
	"testing"
	"time"
)

type memoryKVStore struct {
	values map[string][]byte
}

func (m *memoryKVStore) Open() error { return nil }

func (m *memoryKVStore) Close() error { return nil }

func (m *memoryKVStore) GetValue(bucket string, key []byte) ([]byte, error) {
	value, ok := m.values[fmt.Sprintf("%s:%s", bucket, string(key))]
	if !ok {
		return nil, nil
	}
	return value, nil
}

func (m *memoryKVStore) GetCompressedValue(bucket string, key []byte) ([]byte, error) {
	return m.GetValue(bucket, key)
}

func (m *memoryKVStore) AddValueCompress(bucket string, key []byte, value []byte) error {
	return m.AddValue(bucket, key, value)
}

func (m *memoryKVStore) AddValue(bucket string, key []byte, value []byte) error {
	m.values[fmt.Sprintf("%s:%s", bucket, string(key))] = value
	return nil
}

func (m *memoryKVStore) ExistsKey(bucket string, key []byte) (bool, error) {
	_, ok := m.values[fmt.Sprintf("%s:%s", bucket, string(key))]
	return ok, nil
}

func (m *memoryKVStore) DeleteKey(bucket string, key []byte) error {
	delete(m.values, fmt.Sprintf("%s:%s", bucket, string(key)))
	return nil
}

func TestGenerateAccessTokenIncludesAbsoluteExpiry(t *testing.T) {
	kv.Register("access-token-test", &memoryKVStore{
		values: map[string][]byte{},
	})

	user := &User{
		AuthProvider: "native",
		Username:     "tester",
	}
	user.ID = "user-access-token-expiry"
	t.Cleanup(func() {
		DeleteUserToken(user.ID)
	})

	token, err := GenerateAccessToken(user)
	if err != nil {
		t.Fatalf("generate access token: %v", err)
	}

	expireIn, ok := token["expire_in"].(int64)
	if !ok {
		t.Fatalf("expected expire_in int64, got %T", token["expire_in"])
	}
	if expireIn != int64(accessTokenTTL/time.Second) {
		t.Fatalf("expected expire_in %d, got %d", int64(accessTokenTTL/time.Second), expireIn)
	}

	expiresAt, ok := token["expires_at"].(int64)
	if !ok {
		t.Fatalf("expected expires_at int64, got %T", token["expires_at"])
	}

	now := time.Now().Unix()
	if expiresAt < now+int64(accessTokenTTL/time.Second)-5 || expiresAt > now+int64(accessTokenTTL/time.Second)+5 {
		t.Fatalf("expected expires_at near %d, got %d", now+int64(accessTokenTTL/time.Second), expiresAt)
	}
}
