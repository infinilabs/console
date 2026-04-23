// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

package core

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestReplayNonceCanOnlyBeUsedOnce(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "https://console.local/account/login", nil)

	nonce, _, err := IssueReplayNonce(req, http.MethodPost, "/account/login")
	if err != nil {
		t.Fatalf("issue replay nonce failed: %v", err)
	}

	req.Header.Set(replayNonceHeader, nonce)
	if err := ValidateAndConsumeReplayNonce(req); err != nil {
		t.Fatalf("expected first nonce use to succeed: %v", err)
	}
	if err := ValidateAndConsumeReplayNonce(req); err == nil {
		t.Fatal("expected second nonce use to be rejected")
	}
}

func TestReplayNonceBindsToAuthorizationHeader(t *testing.T) {
	issueReq := httptest.NewRequest(http.MethodPut, "https://console.local/credential/test", nil)
	issueReq.Header.Set("Authorization", "Bearer token-a")

	nonce, _, err := IssueReplayNonce(issueReq, http.MethodPut, "/credential/test")
	if err != nil {
		t.Fatalf("issue replay nonce failed: %v", err)
	}

	useReq := httptest.NewRequest(http.MethodPut, "https://console.local/credential/test", nil)
	useReq.Header.Set(replayNonceHeader, nonce)
	useReq.Header.Set("Authorization", "Bearer token-b")
	if err := ValidateAndConsumeReplayNonce(useReq); err == nil {
		t.Fatal("expected nonce bound to a different authorization header to fail")
	}
}

func TestReplayNonceBindsToPathAndMethod(t *testing.T) {
	issueReq := httptest.NewRequest(http.MethodPost, "https://console.local/setup/_initialize", nil)

	nonce, _, err := IssueReplayNonce(issueReq, http.MethodPost, "/setup/_initialize")
	if err != nil {
		t.Fatalf("issue replay nonce failed: %v", err)
	}

	useReq := httptest.NewRequest(http.MethodPut, "https://console.local/setup/_initialize", nil)
	useReq.Header.Set(replayNonceHeader, nonce)
	if err := ValidateAndConsumeReplayNonce(useReq); err == nil {
		t.Fatal("expected nonce with mismatched method to fail")
	}
}
