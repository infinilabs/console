package insight

import "strings"

func sanitizeAutoRangeInValue(val interface{}) bool {
	switch typed := val.(type) {
	case map[string]interface{}:
		return sanitizeAutoRangeInMap(typed)
	case []interface{}:
		changed := false
		for _, item := range typed {
			if sanitizeAutoRangeInValue(item) {
				changed = true
			}
		}
		return changed
	default:
		return false
	}
}

func sanitizeAutoRangeInMap(data map[string]interface{}) bool {
	if data == nil {
		return false
	}
	changed := false
	for key, val := range data {
		switch typed := val.(type) {
		case map[string]interface{}:
			if key == "range" {
				if sanitizeAutoRangeNode(typed) {
					changed = true
				}
				if len(typed) == 0 {
					delete(data, key)
					changed = true
				}
				continue
			}
			if sanitizeAutoRangeInMap(typed) {
				changed = true
			}
			if len(typed) == 0 {
				delete(data, key)
				changed = true
			}
		case []interface{}:
			newList := make([]interface{}, 0, len(typed))
			listChanged := false
			for _, item := range typed {
				if itemMap, ok := item.(map[string]interface{}); ok {
					if sanitizeAutoRangeInMap(itemMap) {
						listChanged = true
					}
					if len(itemMap) == 0 {
						listChanged = true
						continue
					}
					newList = append(newList, itemMap)
					continue
				}
				newList = append(newList, item)
			}
			if listChanged {
				data[key] = newList
				changed = true
			}
		}
	}
	return changed
}

func sanitizeAutoRangeNode(rangeNode map[string]interface{}) bool {
	changed := false
	for field, condVal := range rangeNode {
		cond, ok := condVal.(map[string]interface{})
		if !ok {
			continue
		}
		for _, boundKey := range []string{"gte", "lte", "gt", "lt", "from", "to"} {
			if isAutoRangeValue(cond[boundKey]) {
				delete(cond, boundKey)
				changed = true
			}
		}
		if !hasRangeBounds(cond) {
			delete(cond, "format")
		}
		if len(cond) == 0 || !hasRangeBounds(cond) {
			delete(rangeNode, field)
			changed = true
		}
	}
	return changed
}

func hasRangeBounds(rangeCond map[string]interface{}) bool {
	for _, key := range []string{"gte", "lte", "gt", "lt", "from", "to"} {
		if _, ok := rangeCond[key]; ok {
			return true
		}
	}
	return false
}

func isAutoRangeValue(value interface{}) bool {
	v, ok := value.(string)
	return ok && strings.EqualFold(strings.TrimSpace(v), "auto")
}
