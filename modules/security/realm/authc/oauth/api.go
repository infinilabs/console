/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package oauth

import (
	rbac "infini.sh/console/core/security"
	"infini.sh/framework/core/api"
)

type APIHandler struct {
	api.Handler
	rbac.Adapter
}

const adapterType = "native"

var apiHandler = APIHandler{Adapter: rbac.GetAdapter(adapterType)} //TODO handle hard coded
