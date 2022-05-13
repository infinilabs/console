/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package funcs

import "infini.sh/framework/core/util"

func formatBytes(precision int, bytes float64) string {
	return util.FormatBytes(bytes, precision)
}