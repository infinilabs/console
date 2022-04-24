package biz

import (
	"context"
	"errors"
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

//type EsRole struct {
//	Cluster []string `json:"cluster,omitempty"`
//	Index   []string `json:"index,omitempty"`
//}

func NewEsContext(ctx context.Context, role EsRole) {
	//get user es role

}

type EsRequest struct {
	Cluster []string `json:"cluster"`
	Index   []string `json:"index"`
}

func ValidateEsPermission(req EsRequest, userRole EsRole) (err error) {
	userClusterMap := make(map[string]struct{})
	userIndexMap := make(map[string]struct{})
	for _, v := range userRole.Cluster {
		userClusterMap[v.Id] = struct{}{}
	}
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
	//for _, v := range req.Index {
	//	if _, ok := userClusterMap[v]; !ok {
	//		err = errors.New("no index permission")
	//		return
	//	}
	//}
	return
}
