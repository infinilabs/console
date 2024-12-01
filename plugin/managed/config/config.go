/* ©INFINI, All Rights Reserved.
 * mail: contact#infini.ltd */

package config

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/core"
	"infini.sh/console/plugin/managed/common"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"infini.sh/framework/core/util/file"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

func init() {
	api.HandleAPIMethod(api.GET, "/config/", h.listConfigAction)
	api.HandleAPIMethod(api.PUT, "/config/", h.saveConfigAction)
	api.HandleAPIMethod(api.DELETE, "/config/", h.deleteConfigAction)
	api.HandleAPIMethod(api.POST, "/config/_reload", h.reloadConfigAction)
	api.HandleAPIMethod(api.GET, "/config/runtime", h.getConfigAction)
	api.HandleAPIMethod(api.GET, "/environments", h.getEnvAction)

}

var h = DefaultHandler{}

type DefaultHandler struct {
	core.Handler
}

func (handler DefaultHandler) getEnvAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	handler.WriteJSONHeader(w)
	handler.WriteJSON(w, os.Environ(), 200)
}

func (handler DefaultHandler) getConfigAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	json := env.GetConfigAsJSON()
	handler.WriteJSONHeader(w)
	handler.Write(w, []byte(json))
}

func validateFile(cfgDir, name string) error {

	cfgDir, _ = filepath.Abs(cfgDir)
	name, _ = filepath.Abs(name)

	//filter out the hidden files and go files
	if strings.HasPrefix(filepath.Base(name), ".") || strings.HasSuffix(filepath.Base(name), ".go") {
		return errors.Errorf("invalid config filename")
	}

	//filetype checking
	ext := filepath.Ext(name)
	if len(global.Env().SystemConfig.Configs.ValidConfigsExtensions) > 0 && !util.ContainsAnyInArray(ext, global.Env().SystemConfig.Configs.ValidConfigsExtensions) {
		return errors.Errorf("invalid config file: %s, only support: %v", name, global.Env().SystemConfig.Configs.ValidConfigsExtensions)
	}

	//permission checking
	if !util.IsFileWithinFolder(name, cfgDir) {
		return errors.Errorf("invalid config file: %s, outside of path: %v", name, cfgDir)
	}
	return nil
}

func DeleteConfig(name string) error {

	cfgDir, err := filepath.Abs(global.Env().GetConfigDir())
	if err != nil {
		return err
	}

	fileToDelete := path.Join(cfgDir, name)

	log.Info("delete config file: ", fileToDelete)

	//file checking
	if err := validateFile(cfgDir, fileToDelete); err != nil {
		return err
	}

	if util.FileExists(fileToDelete) {
		if global.Env().SystemConfig.Configs.SoftDelete {
			err := util.Rename(fileToDelete, fmt.Sprintf("%v.%v.bak", fileToDelete, time.Now().UnixMilli()))
			if err != nil {
				return err
			}
		} else {
			err := util.FileDelete(fileToDelete)
			if err != nil {
				return err
			}
		}
	} else {
		return errors.Errorf("file not exists: %s", fileToDelete)
	}

	return nil
}

func SaveConfig(name string, cfg common.ConfigFile) error {

	//update version
	if cfg.Managed {
		cfg.Content = updateConfigVersion(cfg.Content, cfg.Version)
		cfg.Content = updateConfigManaged(cfg.Content, true)
	}

	return SaveConfigStr(name, cfg.Content)
}

func SaveConfigStr(name, content string) error {

	cfgDir, err := filepath.Abs(global.Env().GetConfigDir())
	if err != nil {
		return err
	}

	fileToSave := path.Join(cfgDir, name)

	log.Info("write config file: ", fileToSave)
	log.Trace("file content: ", content)

	if err := validateFile(cfgDir, fileToSave); err != nil {
		return err
	}

	if util.FileExists(fileToSave) {
		if global.Env().SystemConfig.Configs.SoftDelete {
			err := util.Rename(fileToSave, fmt.Sprintf("%v.%v.bak", fileToSave, time.Now().UnixMilli()))
			if err != nil {
				return err
			}
		}
	}

	_, err = util.FilePutContent(fileToSave, content)
	if err != nil {
		return err
	}

	return nil
}

func (handler DefaultHandler) deleteConfigAction(w http.ResponseWriter, req *http.Request, params httprouter.Params) {
	reqBody := common.ConfigDeleteRequest{}
	err := handler.DecodeJSON(req, &reqBody)
	if err != nil {
		panic(err)
	}

	for _, name := range reqBody.Configs {
		err := DeleteConfig(name)
		if err != nil {
			panic(err)
		}
	}
	handler.WriteAckOKJSON(w)
}

var versionRegexp = regexp.MustCompile(`#MANAGED_CONFIG_VERSION:\s*(?P<version>\d+)`)
var managedRegexp = regexp.MustCompile(`#MANAGED:\s*(?P<managed>\w+)`)

func parseConfigVersion(input string) int64 {
	matches := versionRegexp.FindStringSubmatch(util.TrimSpaces(input))
	if len(matches) > 0 {
		ver := versionRegexp.SubexpIndex("version")
		if ver >= 0 {
			str := (matches[ver])
			v, err := util.ToInt64(util.TrimSpaces(str))
			if err != nil {
				log.Error(err)
			}
			return v
		}
	}
	return -1
}

func parseConfigManaged(input string, defaultManaged bool) bool {
	matches := managedRegexp.FindStringSubmatch(util.TrimSpaces(input))
	if len(matches) > 0 {
		v := managedRegexp.SubexpIndex("managed")
		if v >= 0 {
			str := util.TrimSpaces(strings.ToLower(matches[v]))
			if str == "true" {
				return true
			} else if str == "false" {
				return false
			}
		}
	}
	return defaultManaged
}

func updateConfigManaged(input string, managed bool) string {
	if managedRegexp.MatchString(input) {
		return managedRegexp.ReplaceAllString(input, fmt.Sprintf("#MANAGED: %v", managed))
	} else {
		return fmt.Sprintf("%v\n#MANAGED: %v", input, managed)
	}
}

func updateConfigVersion(input string, newVersion int64) string {
	if versionRegexp.MatchString(input) {
		return versionRegexp.ReplaceAllString(input, fmt.Sprintf("#MANAGED_CONFIG_VERSION: %d", newVersion))
	} else {
		return fmt.Sprintf("%v\n#MANAGED_CONFIG_VERSION: %d", input, newVersion)
	}
}

func (handler DefaultHandler) listConfigAction(w http.ResponseWriter, req *http.Request, params httprouter.Params) {
	configs := GetConfigs(true, false)
	handler.WriteJSON(w, configs, 200)
}

func GetConfigs(returnContent, managedOnly bool) common.ConfigList {

	cfgDir, err := filepath.Abs(global.Env().GetConfigDir())
	if err != nil {
		panic(err)
	}

	configs := common.ConfigList{}
	configs.Configs = make(map[string]common.ConfigFile)

	mainConfig, _ := filepath.Abs(global.Env().GetConfigFile())

	info, err := file.Stat(mainConfig)
	if err != nil {
		panic(err)
	}
	c, err := util.FileGetContent(mainConfig)
	if err != nil {
		panic(err)
	}

	configs.Main = common.ConfigFile{
		Name:     util.TrimLeftStr(filepath.Base(mainConfig), cfgDir),
		Location: mainConfig,
		Readonly: true,
		Managed:  false,
		Updated:  info.ModTime().Unix(),
		Size:     info.Size(),
	}

	if returnContent {
		configs.Main.Content = string(c)
	}

	//get files within folder
	filepath.Walk(cfgDir, func(file string, f os.FileInfo, err error) error {

		cfg, err := GetConfigFromFile(cfgDir, file)
		if cfg != nil {

			if !cfg.Managed && managedOnly {
				return nil
			}

			if !returnContent {
				cfg.Content = ""
			}

			configs.Configs[cfg.Name] = *cfg
		}
		return nil
	})

	return configs
}

func GetConfigFromFile(cfgDir, filename string) (*common.ConfigFile, error) {

	//file checking
	if err := validateFile(cfgDir, filename); err != nil {
		return nil, err
	}

	c, err := util.FileGetContent(filename)
	if err != nil {
		return nil, err
	}

	f, err := file.Stat(filename)
	if err != nil {
		return nil, err
	}

	content := string(c)
	cfg := common.ConfigFile{
		Name:     util.TrimLeftStr(filepath.Base(filename), cfgDir),
		Location: filename,
		Version:  parseConfigVersion(content),
		Updated:  f.ModTime().Unix(),
		Size:     f.Size(),
	}

	cfg.Content = content
	cfg.Managed = parseConfigManaged(content, cfg.Version > 0 || global.Env().SystemConfig.Configs.ConfigFileManagedByDefault)

	return &cfg, nil
}

func (handler DefaultHandler) saveConfigAction(w http.ResponseWriter, req *http.Request, params httprouter.Params) {
	reqBody := common.ConfigUpdateRequest{}
	err := handler.DecodeJSON(req, &reqBody)
	if err != nil {
		panic(err)
	}

	for name, content := range reqBody.Configs {
		err := SaveConfigStr(name, content)
		if err != nil {
			panic(err)
		}
	}
	handler.WriteAckOKJSON(w)
}

func (handler DefaultHandler) reloadConfigAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	log.Infof("refresh config")
	err := global.Env().RefreshConfig()
	if err != nil {
		panic(err)
	}
	handler.WriteAckOKJSON(w)
}
