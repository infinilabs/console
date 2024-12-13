// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

package errors

import (
	"fmt"
	"infini.sh/framework/core/errors"
)

const (
	ErrTypeRequestParams = "request_params_error"
	ErrTypeApplication = "application_error"
	ErrTypeAlreadyExists = "already_exists_error"
	ErrTypeNotExists = "not_exists_error"
	ErrTypeIncorrectPassword = "incorrect_password_error"
	ErrTypeDomainPrefixMismatch = "domain_prefix_mismatch_error"
	ErrTypeDisabled = "disabled_error"
	ErrTypeRequestTimeout = "request_timeout_error"
)

var (
	ErrPasswordIncorrect = errors.New("incorrect password")
	ErrNotExistsErr = errors.New("not exists")
)

type Error struct {
	typ string
	msg interface{}
	field string
}

func (err Error) Error() string {
	return fmt.Sprintf("%s:%v: %v", err.typ, err.field, err.msg)
}

//NewAppError returns an application error
func NewAppError(msg any) *Error {
	return New(ErrTypeApplication, "", msg)
}

//NewParamsError returns a request params error
func NewParamsError(field string, msg any) *Error {
	return New(ErrTypeRequestParams, field, msg)
}

//NewAlreadyExistsError returns an already exists error
func NewAlreadyExistsError(field string, msg any) *Error {
	return New(ErrTypeAlreadyExists, field, msg)
}

//NewNotExistsError returns a not exists error
func NewNotExistsError(field string, msg any) *Error {
	return New(ErrTypeNotExists, field, msg)
}

func New(typ string, field string, msg any) *Error {
	return &Error{
		typ,
		msg,
		field,
	}
}