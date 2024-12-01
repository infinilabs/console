/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package security

import (
	"context"
	"fmt"
	"github.com/golang-jwt/jwt"
)

const ctxUserKey = "user"

type UserClaims struct {
	*jwt.RegisteredClaims
	*ShortUser
}

type ShortUser struct {
	Provider string   `json:"provider"`
	Username string   `json:"username"`
	UserId   string   `json:"user_id"`
	Roles    []string `json:"roles"`
}

const Secret = "console"

func NewUserContext(ctx context.Context, clam *UserClaims) context.Context {
	return context.WithValue(ctx, ctxUserKey, clam)
}

func FromUserContext(ctx context.Context) (*ShortUser, error) {
	ctxUser := ctx.Value(ctxUserKey)
	if ctxUser == nil {
		return nil, fmt.Errorf("user not found")
	}
	reqUser, ok := ctxUser.(*UserClaims)
	if !ok {
		return nil, fmt.Errorf("invalid context user")
	}
	return reqUser.ShortUser, nil
}
