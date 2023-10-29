/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package model

type AgentConfig struct {
	Enabled      bool `config:"enabled"`
	Setup *SetupConfig `config:"setup"`
}

type SetupConfig struct {
	DownloadURL               string      `config:"download_url"`
	Version                   string      `config:"version"`
	CACertFile                string      `config:"ca_cert"`
	CAKeyFile                 string      `config:"ca_key"`
	ConsoleEndpoint           string      `config:"console_endpoint"`
	Port                      string      `config:"port"`
}
