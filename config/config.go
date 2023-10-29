package config

import "infini.sh/framework/core/config"

type AppConfig struct {
	config.APIConfig
	UI UIConfig `config:"ui"`
}

type UIConfig struct {
	LocalPath    string `config:"path"`
	LocalEnabled bool   `config:"local"`
	VFSEnabled   bool   `config:"vfs"`
}
