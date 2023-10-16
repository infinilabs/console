/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package model

import (
	"fmt"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
)

type EmailServer struct {
	orm.ORMObjectBase
	Name string `json:"name" elastic_mapping:"name:{type:text}"`
	Host string `json:"host" elastic_mapping:"host:{type:keyword}"`
	Port int    `json:"port" elastic_mapping:"port:{type:keyword}"`
	TLS  bool   `json:"tls" elastic_mapping:"tls:{type:keyword}"`
	Auth *model.BasicAuth `json:"auth" elastic_mapping:"auth:{type:object}"`
	Enabled bool `json:"enabled" elastic_mapping:"enabled:{type:boolean}"`
	CredentialID string `json:"credential_id" elastic_mapping:"credential_id:{type:keyword}"`
}

func (serv *EmailServer) Validate(requireName bool) error {
	if serv.Host == "" {
		return fmt.Errorf("host can not be empty")
	}
	if serv.Port <= 0 {
		return fmt.Errorf("invalid port [%d]", serv.Port)
	}
	if requireName && serv.Name == "" {
		return fmt.Errorf("name can not be empty")
	}
	return nil
}