package common

import (
	"net"
	"net/url"
	"regexp"
	"strings"
)

var (
	// urlInStringRegex matches http(s)://host:port or http(s)://host embedded in a longer string.
	urlInStringRegex = regexp.MustCompile(`(https?://)([^/:"\s]+)(:[0-9]+)?`)
	// dialTCPRegex matches "dial tcp host:port" patterns in Go network error messages.
	dialTCPRegex = regexp.MustCompile(`(dial tcp )([^:"\s]+)(:[0-9]+)`)
)

// MaskLogError returns the error message with any embedded host/IP addresses redacted.
func MaskLogError(err error) string {
	if err == nil {
		return "<nil>"
	}
	msg := err.Error()
	msg = urlInStringRegex.ReplaceAllString(msg, "${1}***${3}")
	msg = dialTCPRegex.ReplaceAllString(msg, "${1}***${3}")
	return msg
}

func MaskLogToken(value string) string {
	if value == "" {
		return "<empty>"
	}

	if len(value) <= 4 {
		return "***"
	}

	if len(value) <= 8 {
		return value[:1] + "***" + value[len(value)-1:]
	}

	return value[:2] + "***" + value[len(value)-2:]
}

func MaskLogHost(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "<empty>"
	}

	_, port, err := net.SplitHostPort(value)
	if err == nil {
		return "***:" + port
	}

	return "***"
}

func MaskLogEndpoint(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "<empty>"
	}

	parsed, err := url.Parse(value)
	if err == nil && parsed.Host != "" {
		host := "***"
		if port := parsed.Port(); port != "" {
			host += ":" + port
		}
		if parsed.Scheme != "" {
			return parsed.Scheme + "://" + host
		}
		return host
	}

	if strings.Contains(value, "://") {
		return "***"
	}

	return MaskLogHost(value)
}
