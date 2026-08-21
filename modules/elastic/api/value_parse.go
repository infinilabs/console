package api

import (
	"encoding/json"
	"strings"

	"infini.sh/framework/core/util"
)

func parseInt64Value(value interface{}) (int64, bool) {
	if value == nil {
		return 0, false
	}
	switch v := value.(type) {
	case int:
		return int64(v), true
	case int8:
		return int64(v), true
	case int16:
		return int64(v), true
	case int32:
		return int64(v), true
	case int64:
		return v, true
	case uint:
		return int64(v), true
	case uint8:
		return int64(v), true
	case uint16:
		return int64(v), true
	case uint32:
		return int64(v), true
	case uint64:
		return int64(v), true
	case float32:
		return int64(v), true
	case float64:
		return int64(v), true
	case json.Number:
		fv, err := v.Float64()
		if err != nil {
			return 0, false
		}
		return int64(fv), true
	case string:
		trimmed := strings.TrimSpace(v)
		if trimmed == "" {
			return 0, false
		}
		iv, err := util.ToInt64(trimmed)
		if err != nil {
			return 0, false
		}
		return iv, true
	default:
		iv, err := util.ToInt64(strings.TrimSpace(util.ToString(v)))
		if err != nil {
			return 0, false
		}
		return iv, true
	}
}

func parseBoolValue(value interface{}) (bool, bool) {
	if value == nil {
		return false, false
	}
	switch v := value.(type) {
	case bool:
		return v, true
	case string:
		switch strings.ToLower(strings.TrimSpace(v)) {
		case "true", "1", "yes", "y":
			return true, true
		case "false", "0", "no", "n":
			return false, true
		default:
			return false, false
		}
	case int, int8, int16, int32, int64:
		iv, ok := parseInt64Value(v)
		if !ok {
			return false, false
		}
		return iv != 0, true
	case uint, uint8, uint16, uint32, uint64:
		iv, ok := parseInt64Value(v)
		if !ok {
			return false, false
		}
		return iv != 0, true
	case float32, float64, json.Number:
		iv, ok := parseInt64Value(v)
		if !ok {
			return false, false
		}
		return iv != 0, true
	default:
		return false, false
	}
}
