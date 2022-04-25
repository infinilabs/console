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
