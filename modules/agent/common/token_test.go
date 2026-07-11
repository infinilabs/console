package common

import (
	"net/http/httptest"
	"strings"
	"testing"

	"infini.sh/framework/core/model"
	ucfg "infini.sh/framework/lib/go-ucfg"
)

func TestGenerateManagedTokenValueIsDeterministic(t *testing.T) {
	originalSeedFunc := getManagedTokenSeedFunc
	t.Cleanup(func() {
		getManagedTokenSeedFunc = originalSeedFunc
	})

	getManagedTokenSeedFunc = func() ([]byte, error) {
		return []byte("credential-secret"), nil
	}

	first, err := GenerateManagedTokenValue()
	if err != nil {
		t.Fatalf("generate first token: %v", err)
	}
	second, err := GenerateManagedTokenValue()
	if err != nil {
		t.Fatalf("generate second token: %v", err)
	}
	if first != second {
		t.Fatalf("expected deterministic token, got %q and %q", first, second)
	}
}

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

	t.Run("accepts valid api token header", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/instance/_register", nil)
		req.Header.Set(model.API_TOKEN, "manager-token")
		instance := &model.Instance{ManagerCredentialID: "cred-1"}
		err := validateManagerRequestAuth(req, instance, nil, func(instance *model.Instance, tokenValue string) (bool, error) {
			return tokenValue == "manager-token", nil
		}, false)
		if err != nil {
			t.Fatalf("expected api token auth to pass, got %v", err)
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

func TestApplyInstanceHTTPRequestAuth(t *testing.T) {
	t.Run("applies bearer token from access credential", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/ws", nil)
		instance := &model.Instance{AccessCredentialID: "cred-1"}
		RememberPreviousToken("cred-1", "access-token")

		if err := ApplyInstanceHTTPRequestAuth(req, instance); err != nil {
			t.Fatalf("expected auth to apply, got %v", err)
		}

		if got := req.Header.Get("Authorization"); got != "Bearer access-token" {
			t.Fatalf("unexpected authorization header: %q", got)
		}
	})

	t.Run("falls back to direct access token", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/ws", nil)
		instance := &model.Instance{
			AccessToken: &model.Token{
				Value: "direct-token",
			},
		}

		if err := ApplyInstanceHTTPRequestAuth(req, instance); err != nil {
			t.Fatalf("expected access token to apply, got %v", err)
		}

		if got := req.Header.Get("Authorization"); got != "Bearer direct-token" {
			t.Fatalf("unexpected authorization header: %q", got)
		}
	})

	t.Run("falls back to basic auth", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/ws", nil)
		instance := &model.Instance{
			BasicAuth: &model.BasicAuth{
				Username: "managed_gateway",
				Password: ucfg.SecretString("secret"),
			},
		}

		if err := ApplyInstanceHTTPRequestAuth(req, instance); err != nil {
			t.Fatalf("expected basic auth to apply, got %v", err)
		}

		user, password, ok := req.BasicAuth()
		if !ok || user != "managed_gateway" || password != "secret" {
			t.Fatalf("unexpected basic auth credentials: ok=%v user=%q password=%q", ok, user, password)
		}
		if auth := req.Header.Get("Authorization"); !strings.HasPrefix(auth, "Basic ") {
			t.Fatalf("expected basic authorization header, got %q", auth)
		}
	})
}
