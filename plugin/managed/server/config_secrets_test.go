package server

import (
	"fmt"
	"testing"
	"time"

	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/model"
	"infini.sh/framework/modules/configs/common"
)

type managedConfigTestKVStore struct {
	values map[string][]byte
}

func (m *managedConfigTestKVStore) Open() error { return nil }

func (m *managedConfigTestKVStore) Close() error { return nil }

func (m *managedConfigTestKVStore) GetValue(bucket string, key []byte) ([]byte, error) {
	value, ok := m.values[fmt.Sprintf("%s:%s", bucket, string(key))]
	if !ok {
		return nil, nil
	}
	return value, nil
}

func (m *managedConfigTestKVStore) GetCompressedValue(bucket string, key []byte) ([]byte, error) {
	return m.GetValue(bucket, key)
}

func (m *managedConfigTestKVStore) AddValueCompress(bucket string, key []byte, value []byte) error {
	return m.AddValue(bucket, key, value)
}

func (m *managedConfigTestKVStore) AddValueCompressWithTTL(bucket string, key []byte, value []byte, _ time.Duration) error {
	return m.AddValue(bucket, key, value)
}

func (m *managedConfigTestKVStore) AddValue(bucket string, key []byte, value []byte) error {
	m.values[fmt.Sprintf("%s:%s", bucket, string(key))] = value
	return nil
}

func (m *managedConfigTestKVStore) AddValueWithTTL(bucket string, key []byte, value []byte, _ time.Duration) error {
	return m.AddValue(bucket, key, value)
}

func (m *managedConfigTestKVStore) ExistsKey(bucket string, key []byte) (bool, error) {
	_, ok := m.values[fmt.Sprintf("%s:%s", bucket, string(key))]
	return ok, nil
}

func (m *managedConfigTestKVStore) DeleteKey(bucket string, key []byte) error {
	delete(m.values, fmt.Sprintf("%s:%s", bucket, string(key)))
	return nil
}

func TestShouldSyncManagedSecretsTracksSecretChanges(t *testing.T) {
	kv.Register(fmt.Sprintf("managed-config-secrets-%d", time.Now().UnixNano()), &managedConfigTestKVStore{
		values: map[string][]byte{},
	})

	instance := model.Instance{}
	instance.ID = "agent-secret-sync"

	secrets := &common.Secrets{
		Keystore: map[string]common.KeystoreValue{
			"SYSTEM_CLUSTER_INGEST_PASSWORD": {
				Type:  "plaintext",
				Value: "old-password",
			},
		},
	}

	if !shouldSyncManagedSecrets(instance, secrets) {
		t.Fatal("expected initial secrets sync to be required")
	}

	markManagedSecretsSynced(instance, secrets)

	if shouldSyncManagedSecrets(instance, secrets) {
		t.Fatal("expected unchanged secrets not to trigger sync")
	}

	secrets.Keystore["SYSTEM_CLUSTER_INGEST_PASSWORD"] = common.KeystoreValue{
		Type:  "plaintext",
		Value: "new-password",
	}

	if !shouldSyncManagedSecrets(instance, secrets) {
		t.Fatal("expected rotated secrets to trigger sync")
	}
}

func TestShouldSyncManagedSecretsIgnoresEmptySecrets(t *testing.T) {
	instance := model.Instance{}
	instance.ID = "agent-empty-secrets"

	if shouldSyncManagedSecrets(instance, nil) {
		t.Fatal("expected nil secrets not to trigger sync")
	}

	if shouldSyncManagedSecrets(instance, &common.Secrets{Keystore: map[string]common.KeystoreValue{}}) {
		t.Fatal("expected empty secrets not to trigger sync")
	}
}

func TestManagedConfigChangedByVersion(t *testing.T) {
	serverCfg := common.ConfigFile{Version: 2, Content: "a"}
	clientCfg := common.ConfigFile{Version: 1, Content: "a"}
	if !managedConfigChanged(serverCfg, clientCfg) {
		t.Fatal("expected higher version to trigger sync")
	}
}

func TestManagedConfigChangedByContentWhenVersionEqual(t *testing.T) {
	serverCfg := common.ConfigFile{Version: 1, Content: "relay-hosts-new"}
	clientCfg := common.ConfigFile{Version: 1, Content: "relay-hosts-old"}
	if !managedConfigChanged(serverCfg, clientCfg) {
		t.Fatal("expected content change with same version to trigger sync")
	}
}

func TestManagedConfigUnchangedWhenVersionAndContentEqual(t *testing.T) {
	serverCfg := common.ConfigFile{Version: 1, Content: "same-content"}
	clientCfg := common.ConfigFile{Version: 1, Content: "same-content"}
	if managedConfigChanged(serverCfg, clientCfg) {
		t.Fatal("expected unchanged config not to trigger sync")
	}
}
