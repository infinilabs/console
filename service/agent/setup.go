package agentservice

import "sync"

var (
	autoEnrollMu       sync.RWMutex
	autoEnrollCallback func(clusterIDs []string)
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
