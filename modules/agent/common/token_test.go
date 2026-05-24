package common

import (
	"net/http/httptest"
	"testing"

	"infini.sh/framework/core/model"
	ucfg "infini.sh/framework/lib/go-ucfg"
)

func TestValidateManagerRequestAuth(t *testing.T) {
	t.Run("accepts valid manager token", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/instance/_register", nil)
		req.Header.Set("Authorization", "Bearer manager-token")
		instance := &model.Instance{ManagerCredentialID: "cred-1"}
		err := validateManagerRequestAuth(req, instance, nil, func(instance *model.Instance, tokenValue string) (bool, error) {
			return tokenValue == "manager-token", nil
		}, false)
		if err != nil {
			t.Fatalf("expected token auth to pass, got %v", err)
		}
	})

	t.Run("rejects invalid manager token", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/instance/_register", nil)
		instance := &model.Instance{ManagerCredentialID: "cred-1"}
		err := validateManagerRequestAuth(req, instance, nil, func(instance *model.Instance, tokenValue string) (bool, error) {
			return false, nil
		}, false)
		if err != ErrInvalidManagerToken {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("accepts valid manager basic auth", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/configs/_sync", nil)
		req.SetBasicAuth("manager", "secret")
		instance := &model.Instance{}
		basicAuth := &model.BasicAuth{Username: "manager"}
		basicAuth.Password = ucfg.SecretString("secret")
		err := validateManagerRequestAuth(req, instance, basicAuth, func(instance *model.Instance, tokenValue string) (bool, error) {
			t.Fatal("token validator should not be called when manager credential id is empty")
			return false, nil
		}, false)
		if err != nil {
			t.Fatalf("expected basic auth to pass, got %v", err)
		}
	})

	t.Run("rejects when manager auth is not configured", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/ws", nil)
		err := validateManagerRequestAuth(req, &model.Instance{}, nil, func(instance *model.Instance, tokenValue string) (bool, error) {
			t.Fatal("token validator should not be called when manager credential id is empty")
			return false, nil
		}, false)
		if err != ErrManagerAuthNotConfigured {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("allows legacy instance when manager auth is not configured", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/configs/_sync", nil)
		err := validateManagerRequestAuth(req, &model.Instance{}, nil, func(instance *model.Instance, tokenValue string) (bool, error) {
			t.Fatal("token validator should not be called when manager credential id is empty")
			return false, nil
		}, true)
		if err != nil {
			t.Fatalf("expected legacy compatibility to pass, got %v", err)
		}
	})
}
