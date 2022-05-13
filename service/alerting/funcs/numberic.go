/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package funcs

import "infini.sh/framework/core/util"

func toFixed(precision int, num float64) float64{
	return util.ToFixed(num, precision)
}
