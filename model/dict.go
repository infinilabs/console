package model

type Dict struct {
	ID string `json:"id" elastic_meta:"_id"`
	Url         string    `json:"title,omitempty"`
}
