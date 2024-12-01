/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import "infini.sh/framework/core/model"

const REGISTER_API = "/instance/_register"
const SYNC_API = "/configs/_sync"
const GET_INSTALL_SCRIPT_API = "/instance/_get_install_script"

type ConfigFile struct {
	Name     string `json:"name,omitempty"`
	Location string `json:"location,omitempty"`
	Content  string `json:"content,omitempty"`
	Updated  int64  `json:"updated,omitempty"`
	Version  int64  `json:"version,omitempty"`
	Size     int64  `json:"size,omitempty"`
	Readonly bool   `json:"readonly,omitempty"`
	Managed  bool   `json:"managed"`
	Hash     string `json:"hash,omitempty"`
}

type ConfigList struct {
	Main    ConfigFile            `json:"main,omitempty"`
	Configs map[string]ConfigFile `json:"configs,omitempty"`
}

type ConfigDeleteRequest struct {
	Configs []string `json:"configs"`
}

type ConfigUpdateRequest struct {
	Configs map[string]string `json:"configs"`
}

type ConfigSyncRequest struct {
	ForceSync bool           `json:"force_sync"` //ignore hash check in server
	Hash      string         `json:"hash"`
	Client    model.Instance `json:"client"`
	Configs   ConfigList     `json:"configs"`
}

type ConfigSyncResponse struct {
	Changed bool `json:"changed"`
	Configs struct {
		CreatedConfigs map[string]ConfigFile `json:"created,omitempty"`
		DeletedConfigs map[string]ConfigFile `json:"deleted,omitempty"`
		UpdatedConfigs map[string]ConfigFile `json:"updated,omitempty"`
	} `json:"configs,omitempty"`

	Secrets *Secrets `json:"secrets,omitempty"`
}

type ResourceGroup struct {
	Name string   `json:"name"`
	List []string `json:"list"`
}

type ConfigGroup struct {
	Files []string `config:"files"`
}

type InstanceGroup struct {
	ConfigGroups []string `config:"configs"`
	Instances    []string `config:"instances"`
	Secrets      []string `config:"secrets"`
}

type Secrets struct {
	Keystore map[string]KeystoreValue `json:"keystore,omitempty"`
}

type KeystoreValue struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

type ConfigRepo struct {
	ConfigGroups   map[string]ConfigGroup   `config:"configs"`
	InstanceGroups map[string]InstanceGroup `config:"instances"`
	SecretGroups   map[string]Secrets       `config:"secrets"`
}

type InstanceSettings struct {
	ConfigFiles []string `config:"configs"`
	Secrets     []string `config:"secrets"`
}
