package model

type PageResult struct {
	Total int         `json:"total"`
	Data  interface{} `json:"data"`
}
