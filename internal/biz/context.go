package biz

import (
	"context"
	"errors"
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

const ctxUserKey = "user"

func NewUserContext(ctx context.Context, clam *UserClaims) context.Context {
	return context.WithValue(ctx, ctxUserKey, clam)
}
func FromUserContext(ctx context.Context) (*User, error) {
	ctxUser := ctx.Value(ctxUserKey)
	if ctxUser == nil {
		return nil, errors.New("user not found")
	}
	reqUser, ok := ctxUser.(*UserClaims)
	if !ok {
		return nil, errors.New("invalid context user")
	}
	return reqUser.User, nil
}

type EsRequest struct {
	Method  string   `json:"method"`
	Cluster []string `json:"cluster"`

	Index []string `json:"index"`
	Doc   string   `json:"doc"`
	Path  string   `json:"path"`
}

func NewEsRequest(r *http.Request, ps httprouter.Params) EsRequest {

	//GET elasticsearch/c6dgjtgvi076f32oibj0/index/test/_mappings
	clusterId := ps.ByName("id")
	index := ps.ByName("index")

	doc := ps.ByName("docId")
	//如果index存在，说明调用的是index api
	return EsRequest{
		Cluster: []string{clusterId},
		Index:   []string{index},
		Doc:     doc,
		Path:    r.URL.Path,
		Method:  r.Method,
	}
}
func ValidateEsPermission(req EsRequest, userRole Role) (err error) {
	userClusterMap := make(map[string]struct{})
	userIndexMap := make(map[string]struct{})
	for _, v := range userRole.Cluster {
		userClusterMap[v.Id] = struct{}{}
	}
	//todo 启动内存
	for _, val := range userRole.Index {
		for _, v := range val.Name {
			userIndexMap[v] = struct{}{}
		}

	}
	for _, v := range req.Cluster {
		if _, ok := userClusterMap[v]; !ok {
			err = errors.New("no cluster permission")
			return
		}
	}
	for _, v := range req.Index {
		if _, ok := userIndexMap[v]; !ok {
			err = errors.New("no index permission")
			return
		}
	}

	return
}
