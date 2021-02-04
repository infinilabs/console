package model

type ClusterConfig struct {
	ID        string    `json:"id" elastic_meta:"_id"`
	Name string `json:"name" elastic_mapping:"name:{type:text}"`
	Endpoint string `json:"endpoint" elastic_mapping:"name:{type:text}"`
	User string `json:"user" elastic_mapping:"name:{type:keyword}"`
	Password string `json:"password"elastic_mapping:"name:{type:keyword}" `
	Description string `json:"desc" elastic_mapping:"name:{type:text}"`
	Enable bool `json:"enable" elastic_mapping:"name:{type:boolean}"`
}
