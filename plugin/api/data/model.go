/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package data

type ExportDataRequest struct {
	Metadatas []ExportMetadata `json:"metadatas"`
}

type ExportMetadata struct {
	Type string `json:"type"`
	Filter interface{} `json:"filter,omitempty"`
}

type ExportData struct {
	Type string `json:"type"`
	Data []interface{} `json:"data"`
}

const (
	DataTypeAlertRule = "AlertRule"
	DataTypeAlertChannel = "AlertChannel"
	DataTypeAlertEmailServer = "EmailServer"
)