package common

import (
	"net"
	"net/url"
	"strings"
)

func MaskLogToken(value string) string {
	value = strings.TrimSpace(value)
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
