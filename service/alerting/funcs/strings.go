/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package funcs

import "strings"

func substring(start, end int, s string) string {
	runes := []rune(s)
	length := len(runes)
	if start < 0 || start > length || end < 0 || end > length{
		return s
	}
	return string(runes[start:end])
}

func replace(old, new, src string) string {
	return strings.Replace(src, old, new, -1)
}