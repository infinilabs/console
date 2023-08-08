/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package funcs

import (
	"github.com/gomarkdown/markdown"
	"github.com/gomarkdown/markdown/html"
	"github.com/gomarkdown/markdown/parser"
	"strings"
)

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

func mdToHTML(mdText string) string {
	extensions := parser.CommonExtensions | parser.AutoHeadingIDs | parser.NoEmptyLineBeforeBlock
	p := parser.NewWithExtensions(extensions)
	doc := p.Parse([]byte(mdText))

	// create HTML renderer with extensions
	htmlFlags := html.CommonFlags | html.HrefTargetBlank
	opts := html.RendererOptions{Flags: htmlFlags}
	renderer := html.NewRenderer(opts)

	buf := markdown.Render(doc, renderer)
	return string(buf)
}