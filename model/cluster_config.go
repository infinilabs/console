package model

import "time"

type ClusterConfig struct {
	ID        string    `json:"id" elastic_meta:"_id"`
	Name string `json:"name" elastic_mapping:"name:{type:text}"`
	Endpoint string `json:"endpoint" elastic_mapping:"endpoint:{type:text}"`
	UserName string `json:"username" elastic_mapping:"username:{type:keyword}"`
	Password string `json:"password" elastic_mapping:"password:{type:keyword}" `
	Order int `json:"order" elastic_mapping:"order:{type:integer}"`
	Description string `json:"description" elastic_mapping:"description:{type:text}"`
	Enabled bool `json:"enabled" elastic_mapping:"enabled:{type:boolean}"`
	Created time.Time `json:"created" elastic_mapping:"created:{type:date}"`
	Updated time.Time `json:"updated" elastic_mapping:"updated:{type:date}"`
}
