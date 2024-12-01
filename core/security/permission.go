/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package security

import (
	"infini.sh/framework/core/api/routetree"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/util"
	log "src/github.com/cihub/seelog"
	"sync"
)

var permissionsMap = map[string]interface{}{}
var permissionsLocker = sync.Mutex{}

func RegisterPermission(typ string, permissions interface{}) {
	permissionsLocker.Lock()
	defer permissionsLocker.Unlock()
	permissionsMap[typ] = permissions
}

func GetPermissions(typ string) interface{} {
	permissionsLocker.Lock()
	defer permissionsLocker.Unlock()
	return permissionsMap[typ]
}

var RoleMap = make(map[string]Role)

type Token struct {
	JwtStr   string `json:"jwt_str"`
	Value    string `json:"value"`
	ExpireIn int64  `json:"expire_in"`
}

var userTokenLocker = sync.RWMutex{}
var tokenMap = make(map[string]Token)

const KVUserToken = "user_token"

func SetUserToken(key string, token Token) {
	userTokenLocker.Lock()
	tokenMap[key] = token
	userTokenLocker.Unlock()
	_ = kv.AddValue(KVUserToken, []byte(key), util.MustToJSONBytes(token))
}
func GetUserToken(key string) *Token {
	userTokenLocker.RLock()
	defer userTokenLocker.RUnlock()
	if token, ok := tokenMap[key]; ok {
		return &token
	}
	tokenBytes, err := kv.GetValue(KVUserToken, []byte(key))
	if err != nil {
		log.Errorf("get user token from kv error: %v", err)
		return nil
	}
	if tokenBytes == nil {
		return nil
	}
	token := Token{}
	util.MustFromJSONBytes(tokenBytes, &token)
	return &token
}

func DeleteUserToken(key string) {
	userTokenLocker.Lock()
	delete(tokenMap, key)
	userTokenLocker.Unlock()
	_ = kv.DeleteKey(KVUserToken, []byte(key))
}

var apiPermissionRouter = map[string]*routetree.Router{}
var apiPermissionLocker = sync.Mutex{}

func RegisterAPIPermissionRouter(typ string, router *routetree.Router) {
	apiPermissionLocker.Lock()
	defer apiPermissionLocker.Unlock()
	apiPermissionRouter[typ] = router
}

func GetAPIPermissionRouter(typ string) *routetree.Router {
	apiPermissionLocker.Lock()
	defer apiPermissionLocker.Unlock()
	return apiPermissionRouter[typ]
}
