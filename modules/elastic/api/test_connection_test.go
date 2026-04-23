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

package api

import (
	"errors"
	"testing"
)

func TestSanitizeTryConnectError(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want string
	}{
		{
			name: "connection refused",
			err:  errors.New(`Get "https://127.0.0.1:9200": dial tcp 127.0.0.1:9200: connect: connection refused`),
			want: "unable to connect to the cluster endpoint, please check the address, network accessibility, and TLS setting",
		},
		{
			name: "tls mismatch",
			err:  errors.New(`Get "https://127.0.0.1:9200": http: server gave HTTP response to HTTPS client`),
			want: "TLS setting does not match the cluster endpoint, please check whether HTTPS is enabled",
		},
		{
			name: "security exception json",
			err:  errors.New(`{"error":{"root_cause":[{"type":"security_exception","reason":"Missing authentication information for REST request [/]"}],"type":"security_exception","reason":"Missing authentication information for REST request [/]"},"status":401}`),
			want: "authentication is required or invalid, please check the credential",
		},
		{
			name: "html response",
			err:  errors.New(`json: invalid character '<' looking for beginning of value: <!DOCTYPE html><html lang="en"><head></head><body></body></html>`),
			want: "the endpoint did not return an Elasticsearch-compatible API response, please check the address and port",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := sanitizeTryConnectError(tt.err); got != tt.want {
				t.Fatalf("expected %q, got %q", tt.want, got)
			}
		})
	}
}

func TestSanitizeTryConnectErrorKey(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want string
	}{
		{
			name: "connection refused",
			err:  errors.New(`Get "https://127.0.0.1:9200": dial tcp 127.0.0.1:9200: connect: connection refused`),
			want: tryConnectErrorKeyEndpointUnreachable,
		},
		{
			name: "tls mismatch",
			err:  errors.New(`Get "https://127.0.0.1:9200": http: server gave HTTP response to HTTPS client`),
			want: tryConnectErrorKeyTLSMismatch,
		},
		{
			name: "html response",
			err:  errors.New(`json: invalid character '<' looking for beginning of value: <!DOCTYPE html><html lang="en"><head></head><body></body></html>`),
			want: tryConnectErrorKeyNonESEndpoint,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := sanitizeTryConnectErrorKey(tt.err); got != tt.want {
				t.Fatalf("expected %q, got %q", tt.want, got)
			}
		})
	}
}
