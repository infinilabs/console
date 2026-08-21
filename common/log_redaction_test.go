package common

import (
	"fmt"
	"testing"
)

func TestMaskLogError(t *testing.T) {
	testCases := []struct {
		name   string
		input  string
		expect string
	}{
		{
			name:   "nil error",
			input:  "",
			expect: "<nil>",
		},
		{
			name:   "url in get error",
			input:  `request error: Get "http://192.168.3.8:8080/elasticsearch/node/_discovery": dial tcp 192.168.3.8:8080: connect: connection refused`,
			expect: `request error: Get "http://***:8080/elasticsearch/node/_discovery": dial tcp ***:8080: connect: connection refused`,
		},
		{
			name:   "https url",
			input:  `Post "https://10.0.0.1:9200/_bulk": connection refused`,
			expect: `Post "https://***:9200/_bulk": connection refused`,
		},
		{
			name:   "no sensitive data",
			input:  "index out of range",
			expect: "index out of range",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.name == "nil error" {
				if actual := MaskLogError(nil); actual != tc.expect {
					t.Fatalf("unexpected result, got %q want %q", actual, tc.expect)
				}
				return
			}
			err := fmt.Errorf("%s", tc.input)
			if actual := MaskLogError(err); actual != tc.expect {
				t.Fatalf("unexpected masked error, got %q want %q", actual, tc.expect)
			}
		})
	}
}

func TestMaskLogToken(t *testing.T) {
	testCases := []struct {
		name   string
		input  string
		expect string
	}{
		{name: "empty", input: "", expect: "<empty>"},
		{name: "short", input: "abcd", expect: "***"},
		{name: "medium", input: "abcdefgh", expect: "a***h"},
		{name: "long", input: "d8de63bhalhmmus1n7k0", expect: "d8***k0"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if actual := MaskLogToken(tc.input); actual != tc.expect {
				t.Fatalf("unexpected masked token, got %q want %q", actual, tc.expect)
			}
		})
	}
}

func TestMaskLogHost(t *testing.T) {
	testCases := []struct {
		name   string
		input  string
		expect string
	}{
		{name: "empty", input: "", expect: "<empty>"},
		{name: "ipv4 hostport", input: "127.0.0.1:9200", expect: "***:9200"},
		{name: "ipv6 hostport", input: "[::1]:9200", expect: "***:9200"},
		{name: "plain host", input: "node-1.internal", expect: "***"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if actual := MaskLogHost(tc.input); actual != tc.expect {
				t.Fatalf("unexpected masked host, got %q want %q", actual, tc.expect)
			}
		})
	}
}

func TestMaskLogEndpoint(t *testing.T) {
	testCases := []struct {
		name   string
		input  string
		expect string
	}{
		{name: "empty", input: "", expect: "<empty>"},
		{name: "http endpoint", input: "http://192.168.3.185:8080", expect: "http://***:8080"},
		{name: "https ipv6 endpoint", input: "https://[2001:db8::1]:9200", expect: "https://***:9200"},
		{name: "host port", input: "127.0.0.1:9200", expect: "***:9200"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if actual := MaskLogEndpoint(tc.input); actual != tc.expect {
				t.Fatalf("unexpected masked endpoint, got %q want %q", actual, tc.expect)
			}
		})
	}
}
