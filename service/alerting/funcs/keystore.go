/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package funcs

import (
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/keystore"
)

func getKeystoreSecret(key string) string {
	vBytes, err := keystore.GetValue(key)
	if err != nil {
		log.Error("retrieve secret error: ", err)
		return "N/A"
	}
	return string(vBytes)
}
