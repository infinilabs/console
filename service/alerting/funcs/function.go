/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package funcs

import "text/template"

func GenericFuncMap() template.FuncMap {
	gfm := make(map[string]interface{}, len(genericMap))
	for k, v := range genericMap {
		gfm[k] = v
	}
	return gfm
}

var genericMap = map[string]interface{}{
	"hello": func() string { return "Hello!" },
	"format_bytes": formatBytes,
	"to_fixed": toFixed,
	"date": date,
	"date_in_zone": dateInZone,
}
