package config

type AppConfig struct {
	IndexName      string `config:"index_name"`
	Elasticsearch  string `config:"elasticsearch"`
	UILocalPath    string `config:"ui_path"`
	UILocalEnabled bool   `config:"ui_local"`
	UIVFSEnabled   bool   `config:"ui_vfs"`
}
