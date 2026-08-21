package alerting

import "strings"

func normalizeTimeBound(value string) (string, bool) {
	v := strings.TrimSpace(value)
	if v == "" {
		return "", false
	}
	if strings.EqualFold(v, "auto") {
		return "", false
	}
	return v, true
}
