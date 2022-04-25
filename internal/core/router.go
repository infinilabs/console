package core

import (
	"errors"
	"strings"
)

type Router struct {
	roots    map[string]*node
	handlers map[string]string
}

func NewRouter() *Router {
	return &Router{
		roots:    make(map[string]*node),
		handlers: make(map[string]string),
	}
}

// Only one * is allowed
func parsePattern(pattern string) []string {
	vs := strings.Split(pattern, "/")

	parts := make([]string, 0)
	for _, item := range vs {
		if item != "" {
			parts = append(parts, item)
			if item[0] == '*' {
				break
			}
		}
	}
	return parts
}

func (r *Router) AddRoute(method string, pattern string, handler string) {
	parts := parsePattern(pattern)

	key := method + "-" + pattern
	_, ok := r.roots[method]
	if !ok {
		r.roots[method] = &node{}
	}
	r.roots[method].insert(pattern, parts, 0)
	r.handlers[key] = handler
}

func (r *Router) GetRoute(method string, path string) (*node, map[string]string) {
	searchParts := parsePattern(path)
	params := make(map[string]string)
	root, ok := r.roots[method]

	if !ok {
		return nil, nil
	}

	n := root.search(searchParts, 0)

	if n != nil {
		parts := parsePattern(n.pattern)
		for index, part := range parts {
			if part[0] == ':' {
				params[part[1:]] = searchParts[index]
			}
			//if part[0] == '*' && len(part) > 1 {
			//	params[part[1:]] = strings.Join(searchParts[index:], "/")
			//	break
			//}
		}
		return n, params
	}

	return nil, nil
}

func (r *Router) getRoutes(method string) []*node {
	root, ok := r.roots[method]
	if !ok {
		return nil
	}
	nodes := make([]*node, 0)
	root.travel(&nodes)
	return nodes
}

func (r *Router) Handle(method string, path string) (handle string, err error) {
	n, _ := r.GetRoute(method, path)
	if n == nil {
		err = errors.New("router not match")
		return

	}
	return r.handlers[method+"-"+n.pattern], nil
}
