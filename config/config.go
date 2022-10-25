package config

import "infini.sh/framework/core/config"

type AppConfig struct {
	UI UIConfig `config:"ui"`
	Network config.NetworkConfig `config:"network"`
	TLSConfig   config.TLSConfig     `config:"tls"`
}

type UIConfig struct {
	Enabled bool `config:"enabled"`
	LocalPath    string `config:"path"`
	LocalEnabled bool   `config:"local"`
	VFSEnabled   bool   `config:"vfs"`
	APIEndpoint string `config:"api_endpoint"`
}

func (config *AppConfig) GetSchema() string {
	if config.TLSConfig.TLSEnabled {
		return "https"
	}
	return "http"
}
