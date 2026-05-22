package server

import (
	"net/http"
	"testing"

	"infini.sh/framework/core/util"
)

func TestShouldFallbackInstanceInfoPath(t *testing.T) {
	testCases := []struct {
		name   string
		path   string
		res    *util.Result
		err    error
		expect bool
	}{
		{
			name:   "fallback on agent 404",
			path:   "/agent/_info",
			res:    &util.Result{StatusCode: http.StatusNotFound},
			err:    assertiveError("request error"),
			expect: true,
		},
		{
			name:   "no fallback on agent 401",
			path:   "/agent/_info",
			res:    &util.Result{StatusCode: http.StatusUnauthorized},
			err:    assertiveError("request error"),
			expect: false,
		},
		{
			name:   "fallback on transport error",
			path:   "/agent/_info",
			err:    assertiveError("dial tcp"),
			expect: true,
		},
		{
			name:   "no fallback on non agent path",
			path:   "/_info",
			res:    &util.Result{StatusCode: http.StatusNotFound},
			err:    assertiveError("request error"),
			expect: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if actual := shouldFallbackInstanceInfoPath(tc.path, tc.res, tc.err); actual != tc.expect {
				t.Fatalf("unexpected fallback result: got %v want %v", actual, tc.expect)
			}
		})
	}
}

type assertiveError string

func (e assertiveError) Error() string {
	return string(e)
}
