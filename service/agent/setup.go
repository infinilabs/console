package agentservice

import (
	"fmt"
	"strings"
	"sync"

	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	elasticorm "infini.sh/framework/modules/elastic"
)

var (
	autoEnrollMu       sync.RWMutex
	autoEnrollCallback func(clusterIDs []string)
)

const (
	clusterSettingsCategory = "cluster_settings"
	clusterAgentSettings    = "agent"
)

func RegisterAutoEnrollCallback(callback func(clusterIDs []string)) {
	autoEnrollMu.Lock()
	defer autoEnrollMu.Unlock()
	autoEnrollCallback = callback
}

func TriggerAutoEnroll(clusterIDs []string) {
	autoEnrollMu.RLock()
	callback := autoEnrollCallback
	autoEnrollMu.RUnlock()
	if callback == nil {
		return
	}
	callback(clusterIDs)
}

func NormalizeLogsPaths(paths []string) []string {
	seen := map[string]struct{}{}
	result := make([]string, 0, len(paths))
	for _, item := range paths {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		if _, ok := seen[item]; ok {
			continue
		}
		seen[item] = struct{}{}
		result = append(result, item)
	}
	return result
}

func NewClusterAgentSettings(clusterID string, logsPaths []string) *model.Setting {
	logsPaths = NormalizeLogsPaths(logsPaths)
	settings := &model.Setting{
		Metadata: model.Metadata{
			Category: clusterSettingsCategory,
			Name:     clusterAgentSettings,
			Labels: util.MapStr{
				"cluster_id": clusterID,
			},
		},
		Payload: util.MapStr{
			"cluster_id": clusterID,
			"path_logs":  firstString(logsPaths),
			"logs_paths": logsPaths,
		},
	}
	settings.ID = fmt.Sprintf("%s_%s_%s", clusterSettingsCategory, clusterAgentSettings, clusterID)
	return settings
}

func GetClusterLogsPaths(clusterID string) ([]string, error) {
	settings := NewClusterAgentSettings(clusterID, nil)
	exists, err := orm.GetV2(orm.NewContext(), settings)
	if !exists {
		if err != nil && err != elasticorm.ErrNotFound {
			return nil, err
		}
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return NormalizeLogsPaths(extractStringSlice(settings.Payload["logs_paths"], util.ToString(settings.Payload["path_logs"]))), nil
}

func SaveClusterLogsPaths(clusterID string, logsPaths []string) error {
	settings := NewClusterAgentSettings(clusterID, logsPaths)
	normalized, _ := settings.Payload["logs_paths"].([]string)
	if len(normalized) == 0 {
		exists, err := orm.GetV2(orm.NewContext(), settings)
		if !exists {
			if err != nil && err != elasticorm.ErrNotFound {
				return err
			}
			return nil
		}
		if err != nil {
			return err
		}
		return orm.Delete(&orm.Context{Refresh: orm.WaitForRefresh}, settings)
	}
	return orm.Save(&orm.Context{Refresh: orm.WaitForRefresh}, settings)
}

func extractStringSlice(value interface{}, fallback string) []string {
	var items []string
	switch v := value.(type) {
	case nil:
	case []string:
		items = v
	case []interface{}:
		items = make([]string, 0, len(v))
		for _, item := range v {
			items = append(items, util.ToString(item))
		}
	default:
		if fallback != "" {
			items = []string{fallback}
		}
	}
	if len(items) == 0 && fallback != "" {
		items = []string{fallback}
	}
	return items
}

func firstString(items []string) string {
	if len(items) == 0 {
		return ""
	}
	return items[0]
}
