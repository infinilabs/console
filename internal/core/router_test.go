package core

import (
	"fmt"
	"reflect"
	"testing"
)

func newTestRouter() *Router {
	r := NewRouter()
	//GET  "GET/_mapping/:index": "indices.get_mapping",
	r.AddRoute("GET", "/:index/_mappings", "indices.get_mapping")
	r.AddRoute("GET", "/hello/:name", "gethello")
	r.AddRoute("GET", "/hello/b/c", "hellobc")
	r.AddRoute("GET", "/hi/:name", "getHi")
	r.AddRoute("GET", "/role/xushuhui", "getRole")

	return r
}

func TestParsePattern(t *testing.T) {
	ok := reflect.DeepEqual(parsePattern("/p/:name"), []string{"p", ":name"})
	ok = ok && reflect.DeepEqual(parsePattern("/p/*"), []string{"p", "*"})
	ok = ok && reflect.DeepEqual(parsePattern("/p/*name/*"), []string{"p", "*name"})
	if !ok {
		t.Fatal("test parsePattern failed")
	}
}

func TestGetRoute(t *testing.T) {
	//r := newTestRouter()
	//path := "/elasticsearch/c6dgjtgvi076f32oibj0/index/test/_mappings"
	//paths := strings.Split(path, "/")
	//newPath := "/" + strings.Join(paths[4:], "/")
	//t.Log(newPath)

	//if n == nil {
	//	t.Fatal("nil shouldn't be returned")
	//}

	//if n.pattern != "/hello/:name" {
	//	t.Fatal("should match /hello/:name")
	//}
	//
	//if ps["name"] != "geektutu" {
	//	t.Fatal("name should be equal to 'geektutu'")
	//}

	//fmt.Printf("matched path: %s, params['name']: %s\n", n.pattern, ps["name"])

}

func TestGetRoute2(t *testing.T) {
	r := newTestRouter()
	n1, ps1 := r.GetRoute("GET", "/assets/file1.txt")
	ok1 := n1.pattern == "/assets/*filepath" && ps1["filepath"] == "file1.txt"
	if !ok1 {
		t.Fatal("pattern shoule be /assets/*filepath & filepath shoule be file1.txt")
	}

	n2, ps2 := r.GetRoute("GET", "/assets/css/test.css")
	ok2 := n2.pattern == "/assets/*filepath" && ps2["filepath"] == "css/test.css"
	if !ok2 {
		t.Fatal("pattern shoule be /assets/*filepath & filepath shoule be css/test.css")
	}

}

func TestGetRoutes(t *testing.T) {
	r := newTestRouter()
	nodes := r.getRoutes("GET")
	for i, n := range nodes {
		fmt.Println(i+1, n)
	}

	if len(nodes) != 5 {
		t.Fatal("the number of routes shoule be 4")
	}
}
