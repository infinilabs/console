/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package funcs

import (
	"strings"
	"text/template"
)

func GenericFuncMap() template.FuncMap {
	gfm := make(map[string]interface{}, len(genericMap))
	for k, v := range genericMap {
		gfm[k] = v
	}
	return gfm
}

var genericMap = map[string]interface{}{
	"hello":        func() string { return "Hello!" },
	"format_bytes": formatBytes,
	"to_fixed":     toFixed,
	"date":         date,
	"date_in_zone": dateInZone,
	"datetime": datetime,
	"datetime_in_zone": datetimeInZone,
	"to_upper":     strings.ToUpper,
	"to_lower":     strings.ToLower,
	"add": add,
	"sub": sub,
	"div": div,
	"mul": mul,
	"lookup": lookup,
	"str_replace": replace,
	"md_to_html": mdToHTML,
	//"get_keystore_secret": getKeystoreSecret,
}
