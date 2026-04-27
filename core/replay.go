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
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	pathutil "path"
	"strings"
	"sync"
	"time"

	"infini.sh/framework/core/util"
)

const replayNonceHeader = "X-Request-Nonce"
const replayNonceTTL = 30 * time.Second

type replayNonceRecord struct {
	Subject   string
	Method    string
	Path      string
	ExpiresAt time.Time
}

type replayNonceStore struct {
	mu      sync.Mutex
	records map[string]replayNonceRecord
}

var sensitiveRequestNonceStore = replayNonceStore{
	records: map[string]replayNonceRecord{},
}

func IssueReplayNonce(r *http.Request, method, requestPath string) (string, time.Duration, error) {
	normalizedMethod, normalizedPath, err := normalizeReplayScope(method, requestPath)
	if err != nil {
		return "", 0, err
	}

	nonce := util.GenerateSecureString(32)
	if nonce == "" {
		return "", 0, fmt.Errorf("failed to generate replay nonce")
	}

	subject := replayRequestSubject(r)
	expiresAt := time.Now().Add(replayNonceTTL)

	sensitiveRequestNonceStore.mu.Lock()
	defer sensitiveRequestNonceStore.mu.Unlock()
	sensitiveRequestNonceStore.cleanupExpiredLocked(time.Now())
	sensitiveRequestNonceStore.records[nonce] = replayNonceRecord{
		Subject:   subject,
		Method:    normalizedMethod,
		Path:      normalizedPath,
		ExpiresAt: expiresAt,
	}
	return nonce, replayNonceTTL, nil
}

func ValidateAndConsumeReplayNonce(r *http.Request) error {
	if r == nil {
		return fmt.Errorf("request can not be nil")
	}

	nonce := strings.TrimSpace(r.Header.Get(replayNonceHeader))
	if nonce == "" {
		return fmt.Errorf("missing replay nonce")
	}

	subject := replayRequestSubject(r)
	method, requestPath, err := normalizeReplayScope(r.Method, r.URL.Path)
	if err != nil {
		return err
	}

	now := time.Now()
	sensitiveRequestNonceStore.mu.Lock()
	defer sensitiveRequestNonceStore.mu.Unlock()
	sensitiveRequestNonceStore.cleanupExpiredLocked(now)

	record, ok := sensitiveRequestNonceStore.records[nonce]
	if !ok {
		return fmt.Errorf("replay nonce is invalid or expired")
	}
	delete(sensitiveRequestNonceStore.records, nonce)

	if record.Subject != subject || record.Method != method || record.Path != requestPath {
		return fmt.Errorf("replay nonce does not match request context")
	}

	return nil
}

func (store *replayNonceStore) cleanupExpiredLocked(now time.Time) {
	for nonce, record := range store.records {
		if now.After(record.ExpiresAt) {
			delete(store.records, nonce)
		}
	}
}

func normalizeReplayScope(method, requestPath string) (string, string, error) {
	normalizedMethod := strings.ToUpper(strings.TrimSpace(method))
	switch normalizedMethod {
	case http.MethodPost, http.MethodPut, http.MethodDelete:
	default:
		return "", "", fmt.Errorf("unsupported replay-protected method [%s]", method)
	}

	normalizedPath := strings.TrimSpace(requestPath)
	if normalizedPath == "" {
		return "", "", fmt.Errorf("request path can not be empty")
	}
	if !strings.HasPrefix(normalizedPath, "/") {
		normalizedPath = "/" + normalizedPath
	}
	normalizedPath = pathutil.Clean(normalizedPath)
	if normalizedPath == "." {
		normalizedPath = "/"
	}

	return normalizedMethod, normalizedPath, nil
}

func replayRequestSubject(r *http.Request) string {
	if r == nil {
		return "anonymous"
	}

	authorizationHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authorizationHeader == "" {
		return "anonymous"
	}

	sum := sha256.Sum256([]byte(authorizationHeader))
	return hex.EncodeToString(sum[:])
}
