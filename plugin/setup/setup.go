// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

package task

import (
	"bufio"
	"bytes"
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	uri2 "net/url"
	"path"
	"runtime"
	"strings"
	"time"

	"infini.sh/console/core/security"
	"infini.sh/framework/lib/go-ucfg"
	elastic2 "infini.sh/framework/modules/elastic"

	log "github.com/cihub/seelog"
	"github.com/valyala/fasttemplate"
	"golang.org/x/crypto/bcrypt"
	elastic3 "infini.sh/console/modules/elastic/api"
	security2 "infini.sh/console/modules/security"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/keystore"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/module"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/pipeline"
	"infini.sh/framework/core/util"
	"infini.sh/framework/lib/fasthttp"
	keystore2 "infini.sh/framework/lib/keystore"
	"infini.sh/framework/modules/elastic/adapter"
	elastic1 "infini.sh/framework/modules/elastic/common"
	"infini.sh/framework/plugins/replay"
)

type Module struct {
	api.Handler
}

func (module *Module) Name() string {
	return "setup"
}

func init() {
	module.RegisterSystemModule(&Module{})
}

func (module *Module) Setup() {

	if !global.Env().SetupRequired() {
		return
	}

	api.HandleAPIMethod(api.POST, "/setup/_validate", module.validate)
	api.HandleAPIMethod(api.POST, "/setup/_initialize", module.initialize)
	api.HandleAPIMethod(api.POST, "/setup/_validate_secret", module.validateSecret)
	api.HandleAPIMethod(api.POST, "/setup/_initialize_template", module.initializeTemplate)
	elastic3.InitTestAPI()
}

var setupFinishedCallback = []func(){}

func RegisterSetupCallback(f func()) {
	setupFinishedCallback = append(setupFinishedCallback, f)
}

func InvokeSetupCallback() {
	for _, v := range setupFinishedCallback {
		v()
	}
}

func (module *Module) Start() error {
	credential.RegisterChangeEvent(func(cred *credential.Credential) {
		if cred == nil {
			return
		}
		sysClusterID := global.MustLookupString(elastic.GlobalSystemElasticsearchID)
		conf := elastic.GetConfig(sysClusterID)
		if conf.CredentialID != cred.ID {
			return
		}
		bv, err := cred.Decode()
		if err != nil {
			log.Error(err)
			return
		}
		if basicAuth, ok := bv.(model.BasicAuth); ok {
			err = keystore.SetValue("SYSTEM_CLUSTER_PASS", []byte(basicAuth.Password.Get()))
			if err != nil {
				log.Error(err)
			}
		}
	})
	return nil
}
func (module *Module) Stop() error {
	return nil
}

type SetupRequest struct {
	Cluster struct {
		Host     string   `json:"host"`
		Schema   string   `json:"schema"`
		Endpoint string   `json:"endpoint"`
		Username string   `json:"username"`
		Password string   `json:"password"`
		Hosts    []string `json:"hosts"`
	} `json:"cluster"`

	Skip               bool   `json:"skip"`
	BootstrapUsername  string `json:"bootstrap_username"`
	BootstrapPassword  string `json:"bootstrap_password"`
	CredentialSecret   string `json:"credential_secret"`
	InitializeTemplate string `json:"initialize_template"`
}

var GlobalSystemElasticsearchID = "infini_default_system_cluster"

const VersionTooOld = "elasticsearch_version_too_old"
const IndicesExists = "elasticsearch_indices_exists"
const TemplateExists = "elasticsearch_template_exists"
const VersionNotSupport = "unknown_cluster_version"

var cfg1 elastic1.ORMConfig

func (module *Module) validate(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

	if !global.Env().SetupRequired() {
		module.WriteError(w, "setup not permitted", 500)
		return
	}

	success := false
	var err error
	var errType string
	var fixTips string
	var code int
	code = 200
	defer func() {

		global.Env().CheckSetup()

		result := util.MapStr{}
		result["success"] = success

		if r := recover(); r != nil {
			var v string
			switch r.(type) {
			case error:
				v = r.(error).Error()
			case runtime.Error:
				v = r.(runtime.Error).Error()
			case string:
				v = r.(string)
			}
			if v != "" {
				success = false
				result["error"] = util.MapStr{
					"reason": v,
				}
				if errType != "" {
					result["type"] = errType
				}
				if fixTips != "" {
					result["fix_tips"] = fixTips
				}
				code = 500
			}
		}
		module.WriteJSON(w, result, code)
	}()

	err, client, _ := module.initTempClient(r)
	if err != nil {
		panic(err)
	}

	//validate version
	verInfo, err := adapter.ClusterVersion(elastic.GetMetadata(cfg.ID))
	if err != nil {
		panic(err)
	}
	if verInfo.Version.Distribution == elastic.Elasticsearch {
		if verInfo.Version.Number != "" {
			ver := &util.Version{}
			ver, err = util.ParseSemantic(verInfo.Version.Number)
			if err != nil {
				panic(err)
			}
			if ver.Major() == 5 && ver.Minor() < 3 {
				errType = VersionTooOld
				panic(errors.Errorf("elasticsearch version(%v) should greater than v5.3", verInfo.Version.Number))
			} else if ver.Major() < 5 {
				errType = VersionTooOld
				panic(errors.Errorf("elasticsearch version(%v) should greater than v5.3", verInfo.Version.Number))
			}
		}
	} else if verInfo.Version.Distribution != elastic.Easysearch && verInfo.Version.Distribution != elastic.Opensearch {
		errType = VersionNotSupport
		panic(errors.Errorf("unknown distribution (%v)", verInfo.Version.Distribution))
	}
	cfg1 = elastic1.ORMConfig{}
	exist, err := env.ParseConfig("elastic.orm", &cfg1)
	if exist && err != nil && global.Env().SystemConfig.Configs.PanicOnConfigError {
		panic(err)
	}

	if cfg1.IndexPrefix == "" {
		cfg1.IndexPrefix = ".infini_"
	}
	if cfg1.TemplateName == "" {
		cfg1.TemplateName = ".infini"
	}

	//validate indices
	indices, err := client.GetIndices(util.TrimSpaces(cfg1.IndexPrefix) + "*")
	if err != nil {
		panic(err)
	}

	if indices != nil && len(*indices) > 0 {
		buff := bytes.Buffer{}
		tipBuff := bytes.Buffer{}
		for k, _ := range *indices {
			buff.WriteString(k)
			buff.WriteString("\n")

			tipBuff.WriteString("DELETE ")
			tipBuff.WriteString(k)
			tipBuff.WriteString("\n")
		}
		errType = IndicesExists
		fixTips = tipBuff.String()
		panic(errors.Errorf("there are following indices exists in target elasticsearch: \n%v", buff.String()))
	}

	ok, err := client.TemplateExists(cfg1.TemplateName)
	if err != nil {
		panic(err)
	}
	if ok {
		errType = TemplateExists
		fixTips = "DELETE /_template/" + util.TrimSpaces(cfg1.TemplateName)
		panic(errors.Errorf("there are following template already exists in target elasticsearch: \n%v", cfg1.TemplateName))
	}

	success = true
}

var cfg elastic.ElasticsearchConfig

func (module *Module) initTempClient(r *http.Request) (error, elastic.API, SetupRequest) {
	request := SetupRequest{}
	err := module.DecodeJSON(r, &request)
	if err != nil {
		return err, nil, request
	}

	if request.Cluster.Endpoint == "" && request.Cluster.Host == "" {
		panic("invalid configuration")
	}

	if request.Cluster.Endpoint == "" {
		if request.Cluster.Host != "" && request.Cluster.Schema != "" {
			request.Cluster.Endpoint = fmt.Sprintf("%v://%v", request.Cluster.Schema, request.Cluster.Host)
		}
	}

	cfg = elastic.ElasticsearchConfig{
		Enabled:  true,
		Reserved: true,
		Endpoint: request.Cluster.Endpoint,
		BasicAuth: &model.BasicAuth{
			Username: request.Cluster.Username,
			Password: ucfg.SecretString(request.Cluster.Password),
		},
	}

	if cfg.Endpoint != "" && cfg.Host == "" {
		uri, err := uri2.Parse(cfg.Endpoint)
		if err != nil {
			panic(err)
		}
		cfg.Host = uri.Host
		cfg.Schema = uri.Scheme
	}

	cfg.ID = GlobalSystemElasticsearchID
	cfg.Name = "INFINI_SYSTEM (" + util.PickRandomName() + ")"
	elastic.InitMetadata(&cfg, true)
	verInfo, err := adapter.ClusterVersion(elastic.GetMetadata(cfg.ID))
	if err != nil {
		panic(err)
	}
	cfg.ClusterUUID = verInfo.ClusterUUID

	client, err := elastic1.InitClientWithConfig(cfg)
	if err != nil {
		return err, nil, request
	}

	global.Register(elastic.GlobalSystemElasticsearchID, GlobalSystemElasticsearchID)

	elastic.UpdateConfig(cfg)
	elastic.UpdateClient(cfg, client)
	health, err := client.ClusterHealth(context.Background())
	if err != nil {
		return err, nil, request
	}
	if health != nil {
		cfg.RawName = health.Name
	}
	ver := client.GetVersion()
	cfg.Version = ver.Number
	cfg.Distribution = ver.Distribution

	return err, client, request
}

func (module *Module) initialize(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	if !global.Env().SetupRequired() {
		module.WriteError(w, "setup not permitted", 500)
		return
	}
	var (
		success        = false
		errType        string
		fixTips        string
		code           = 200
		secretMismatch = false
	)
	defer func() {

		global.Env().CheckSetup()

		result := util.MapStr{
			"secret_mismatch": secretMismatch,
		}
		result["success"] = success

		if r := recover(); r != nil {
			var v string
			switch r.(type) {
			case error:
				v = r.(error).Error()
			case runtime.Error:
				v = r.(runtime.Error).Error()
			case string:
				v = r.(string)
			}
			if v != "" {
				success = false
				result["error"] = util.MapStr{
					"reason": v,
				}
				if errType != "" {
					result["type"] = errType
				}
				if fixTips != "" {
					result["fix_tips"] = fixTips
				}
				code = 500
			}
		}
		module.WriteJSON(w, result, code)
	}()
	err, client, request := module.initTempClient(r)
	if err != nil {
		panic(err)
	}
	request.CredentialSecret = strings.TrimSpace(request.CredentialSecret)
	if request.CredentialSecret == "" {
		panic("miss credential secret")
	}
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	consoleEndpoint := fmt.Sprintf("%s://%s", scheme, r.Host)
	err = kv.AddValue("system", []byte("INFINI_CONSOLE_ENDPOINT"), []byte(consoleEndpoint))
	if err != nil {
		log.Error(err)
	}

	if cfg1.IndexPrefix == "" {
		cfg1.IndexPrefix = ".infini_"
	}
	if cfg1.TemplateName == "" {
		cfg1.TemplateName = ".infini"
	}

	if !cfg1.Enabled {
		cfg1.Enabled = true
	}

	if !cfg1.InitTemplate {
		cfg1.InitTemplate = true
	}

	cfg.Reserved = true
	cfg.Monitored = true
	cfg.Source = elastic.ElasticsearchConfigSourceElasticsearch

	//处理ORM
	handler := elastic2.ElasticORM{Client: client, Config: cfg1}

	orm.Register("elastic_setup_"+util.GetUUID(), &handler)
	//validate secret key
	exists, err := validateCredentialSecret(&handler, request.CredentialSecret)
	if err != nil && err != errSecretMismatch {
		panic(err)
	}
	if err == errSecretMismatch {
		secretMismatch = true
	}
	//不存在或者密钥不匹配时保存凭据密钥
	if err == errSecretMismatch || !exists {
		h := md5.New()
		rawSecret := []byte(request.CredentialSecret)
		h.Write(rawSecret)
		secret := make([]byte, 32)
		hex.Encode(secret, h.Sum(nil))
		err = credential.InitSecret(nil, secret)
		if err != nil {
			panic(err)
		}
	}
	//处理索引
	security2.InitSchema() //register user index
	elastic2.InitSchema()
	toSaveCfg := cfg
	oldCfg := elastic.ElasticsearchConfig{}
	oldCfg.ID = toSaveCfg.ID
	_, _ = orm.Get(&oldCfg)
	//当原系统集群存在时更新配置
	if oldCfg.Name != "" {
		toSaveCfg = oldCfg
		toSaveCfg.Endpoint = cfg.Endpoint
		toSaveCfg.Schema = cfg.Schema
		toSaveCfg.Host = cfg.Host
		toSaveCfg.Source = cfg.Source
		toSaveCfg.Version = cfg.Version
		toSaveCfg.Distribution = cfg.Distribution
	}
	if request.Cluster.Username != "" || request.Cluster.Password != "" {
		var reuseOldCred = false
		if oldCfg.CredentialID != "" && !secretMismatch {
			basicAuth, _ := elastic1.GetBasicAuth(&oldCfg)
			if basicAuth != nil {
				if basicAuth.Username == request.Cluster.Username && basicAuth.Password.Get() == request.Cluster.Password {
					reuseOldCred = true
				}
			}
		}
		if reuseOldCred {
			toSaveCfg.CredentialID = oldCfg.CredentialID
		} else {
			cred := credential.Credential{
				Name: "INFINI_SYSTEM",
				Type: credential.BasicAuth,
				Tags: []string{"infini", "system"},
				Payload: map[string]interface{}{
					"basic_auth": map[string]interface{}{
						"username": request.Cluster.Username,
						"password": request.Cluster.Password,
					},
				},
			}
			cred.ID = util.GetUUID()
			err = cred.Encode()
			if err != nil {
				panic(err)
			}
			toSaveCfg.CredentialID = cred.ID
			cfg.CredentialID = cred.ID
			now := time.Now()
			cred.Created = &now
			err = orm.Save(nil, &cred)
			if err != nil {
				panic(err)
			}
			toSaveCfg.BasicAuth = nil
		}
	}

	//保存默认集群
	t := time.Now()
	toSaveCfg.Created = &t
	err = orm.Save(nil, &toSaveCfg)
	if err != nil {
		panic(err)
	}

	if request.BootstrapUsername != "" && request.BootstrapPassword != "" {
		//Save bootstrap user
		user := security.User{}
		user.ID = "default_user_" + request.BootstrapUsername
		user.Username = request.BootstrapUsername
		user.Nickname = request.BootstrapUsername
		var hash []byte
		hash, err = bcrypt.GenerateFromPassword([]byte(request.BootstrapPassword), bcrypt.DefaultCost)
		if err != nil {
			panic(err)
		}

		user.Password = string(hash)
		role := []security.UserRole{}
		role = append(role, security.UserRole{
			ID:   security.RoleAdminName,
			Name: security.RoleAdminName,
		})
		user.Roles = role
		now := time.Now()
		user.Created = &now
		err = orm.Save(nil, &user)
		if err != nil {
			panic(err)
		}
	}
	err = keystore.SetValue("SYSTEM_CLUSTER_PASS", []byte(cfg.BasicAuth.Password.Get()))
	if err != nil {
		panic(err)
	}

	//save to local file
	file := path.Join(global.Env().GetConfigDir(), "system_config.yml")
	_, err = util.FilePutContent(file, fmt.Sprintf("configs.template:\n  - name: \"system\"\n    path: ./config/system_config.tpl\n    variable:\n      "+
		"CLUSTER_ID: %v\n      CLUSTER_ENDPOINT: \"%v\"\n      "+
		"CLUSTER_USER: \"%v\"\n      CLUSTER_VER: \"%v\"\n      CLUSTER_DISTRIBUTION: \"%v\"\n      INDEX_PREFIX: \"%v\"",
		GlobalSystemElasticsearchID, cfg.GetAnyEndpoint(), cfg.BasicAuth.Username, cfg.Version, cfg.Distribution, cfg1.IndexPrefix))
	if err != nil {
		panic(err)
	}

	//callback
	InvokeSetupCallback()

	//place setup lock file
	setupLock := path.Join(global.Env().GetDataDir(), ".setup_lock")
	_, err = util.FilePutContent(setupLock, time.Now().String())
	if err != nil {
		panic(err)
	}
	//update credential state
	q := util.MapStr{
		"query": util.MapStr{
			"range": util.MapStr{
				"created": util.MapStr{
					"lte": "now-30s",
				},
			},
		},
		"script": util.MapStr{
			"source": fmt.Sprintf("ctx._source['invalid'] = %v", secretMismatch),
		},
	}
	err = orm.UpdateBy(credential.Credential{}, util.MustToJSONBytes(q))
	if err != nil {
		log.Error(err)
	}

	success = true
}
func (module *Module) validateSecret(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	err, client, request := module.initTempClient(r)
	if err != nil {
		module.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	handler := elastic2.ElasticORM{Client: client, Config: cfg1}

	_, err = validateCredentialSecret(&handler, request.CredentialSecret)
	if err != nil && err != errSecretMismatch {
		module.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	module.WriteJSON(w, util.MapStr{
		"success": err == nil,
	}, http.StatusOK)

}

var errSecretMismatch = fmt.Errorf("invalid credential secret")

func validateCredentialSecret(ormHandler orm.ORM, credentialSecret string) (bool, error) {
	rkey, err := keystore.GetValue(credential.SecretKey)
	var exists bool
	if err != nil && err != keystore2.ErrKeyDoesntExists {
		return exists, err
	}
	h := md5.New()
	rawSecret := []byte(credentialSecret)
	h.Write(rawSecret)
	secret := make([]byte, 32)
	hex.Encode(secret, h.Sum(nil))
	if err == nil {
		exists = true
		if bytes.Compare(rkey, secret) != 0 {
			return exists, errSecretMismatch
		}
	} else {
		exists = false
		tempCred := credential.Credential{}
		var result orm.Result
		err, result = ormHandler.Search(&tempCred, &orm.Query{
			Size: 1,
		})
		if err != nil {
			return exists, err
		}
		if len(result.Result) > 0 {
			buf := util.MustToJSONBytes(result.Result[0])
			util.MustFromJSONBytes(buf, &tempCred)
			tempCred.SetSecret(secret)
			_, err = tempCred.Decode()
			if err != nil {
				return exists, errSecretMismatch
			}
		}
	}
	return exists, nil
}

func getYamlData(filename string) []byte {
	baseDir := path.Join(global.Env().GetConfigDir(), "setup")
	filePath := path.Join(baseDir, "common", "data", filename)
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		log.Errorf("Error reading YAML file:", err)
		return nil
	}
	// 转义换行符
	escapedContent := bytes.ReplaceAll(content, []byte("\n"), []byte("\\n"))
	// 转义双引号
	escapedContent = bytes.ReplaceAll(escapedContent, []byte("\""), []byte("\\\""))
	return escapedContent
}
func (module *Module) initializeTemplate(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	if !global.Env().SetupRequired() {
		module.WriteError(w, "setup not permitted", 500)
		return
	}
	defer func() {
		if v := recover(); v != nil {
			module.WriteJSON(w, util.MapStr{
				"success": false,
				"log":     fmt.Sprintf("%v", v),
			}, http.StatusOK)
		}
	}()
	request := SetupRequest{}
	err := module.DecodeJSON(r, &request)
	if err != nil {
		panic(err)
	}

	ver := elastic.GetClient(GlobalSystemElasticsearchID).GetVersion()
	if ver.Distribution == "" {
		ver.Distribution = elastic.Elasticsearch
	}
	baseDir := path.Join(global.Env().GetConfigDir(), "setup")
	var (
		dslTplFileName = "noop.tpl"
		useCommon      = true
	)
	switch request.InitializeTemplate {
	case "template_ilm":
		useCommon = false
		dslTplFileName = "template_ilm.tpl"
		elastic2.InitTemplate(true)
	case "rollup":
		if ver.Distribution == elastic.Easysearch {
			if large, _ := util.VersionCompare(ver.Number, "1.10.0"); large > 0 {
				useCommon = false
				dslTplFileName = "template_rollup.tpl"
			}
		}
	case "alerting":
		dslTplFileName = "alerting.tpl"
	case "insight":
		dslTplFileName = "insight.tpl"
	case "view":
		dslTplFileName = "view.tpl"
	case "agent":
		dslTplFileName = "agent.tpl"
	default:
		panic(fmt.Sprintf("unsupport template name [%s]", request.InitializeTemplate))
	}

	if useCommon {
		baseDir = path.Join(baseDir, "common")
	} else {
		baseDir = path.Join(baseDir, ver.Distribution)
	}

	docType := "_doc"
	switch ver.Distribution {
	case elastic.Elasticsearch:
		majorVersion := elastic.GetClient(GlobalSystemElasticsearchID).GetMajorVersion()
		if !useCommon {
			if majorVersion == 6 {
				baseDir = path.Join(baseDir, "v6")
			} else if majorVersion <= 5 {
				baseDir = path.Join(baseDir, "v5")
			}
		}
		if majorVersion < 7 {
			docType = "doc"
		}
		break
	case elastic.Easysearch:
		break
	case elastic.Opensearch:
		break
	}

	dslTplFile := path.Join(baseDir, dslTplFileName)
	if !util.FileExists(dslTplFile) {
		panic(errors.Errorf("template file %v for setup was missing", dslTplFile))
	}

	var dsl []byte
	dsl, err = util.FileGetContent(dslTplFile)
	if err != nil {
		panic(err)
	}
	if len(dsl) == 0 {
		panic(fmt.Sprintf("got empty template [%s]", dslTplFile))
	}

	var tpl *fasttemplate.Template
	tpl, err = fasttemplate.NewTemplate(string(dsl), "$[[", "]]")
	if err != nil {
		module.WriteJSON(w, util.MapStr{
			"success": false,
			"log":     fmt.Sprintf("new fasttemplate [%s] error: ", err.Error()),
		}, http.StatusOK)
		return
	}
	output := tpl.ExecuteFuncString(func(w io.Writer, tag string) (int, error) {
		switch tag {
		case "SETUP_SYSTEM_INGEST_CONFIG":
			return w.Write(getYamlData("system_ingest_config.dat"))
		case "SETUP_TASK_CONFIG_TPL":
			return w.Write(getYamlData("task_config_tpl.dat"))
		case "SETUP_AGENT_RELAY_GATEWAY_CONFIG":
			return w.Write(getYamlData("agent_relay_gateway_config.dat"))
		}
		//ignore unresolved variable
		return w.Write([]byte("$[[" + tag + "]]"))
	})

	tpl, err = fasttemplate.NewTemplate(output, "$[[", "]]")
	output = tpl.ExecuteFuncString(func(w io.Writer, tag string) (int, error) {
		switch tag {
		case "SETUP_ES_USERNAME":
			return w.Write([]byte(request.Cluster.Username))
		case "SETUP_ES_PASSWORD":
			return w.Write([]byte(request.Cluster.Password))
		case "SETUP_SCHEME":
			return w.Write([]byte(strings.Split(request.Cluster.Endpoint, "://")[0]))
		case "SETUP_ENDPOINTS":
			endpoints := []string{request.Cluster.Endpoint}
			for _, host := range request.Cluster.Hosts {
				endpoint := fmt.Sprintf("%s://%s", request.Cluster.Schema, host)
				if !util.StringInArray(endpoints, endpoint) {
					endpoints = append(endpoints, endpoint)
				}
			}
			endpointBytes := util.MustToJSONBytes(endpoints)
			endpointBytes = bytes.ReplaceAll(endpointBytes, []byte("\""), []byte("\\\""))
			return w.Write(endpointBytes)
		case "SETUP_HOSTS":
			hostsBytes := util.MustToJSONBytes(request.Cluster.Hosts)
			hostsBytes = bytes.ReplaceAll(hostsBytes, []byte("\""), []byte("\\\""))
			return w.Write(hostsBytes)
		case "SETUP_TEMPLATE_NAME":
			return w.Write([]byte(cfg1.TemplateName))
		case "SETUP_INDEX_PREFIX":
			return w.Write([]byte(cfg1.IndexPrefix))
		case "SETUP_RESOURCE_ID":
			return w.Write([]byte(cfg.ID))
		case "SETUP_RESOURCE_NAME":
			return w.Write([]byte(cfg.Name))
		case "SETUP_USER_ID":
			return w.Write([]byte("default_user_" + request.BootstrapUsername))
		case "SETUP_USERNAME":
			return w.Write([]byte(request.BootstrapUsername))
		case "SETUP_DOC_TYPE":
			return w.Write([]byte(docType))
		}
		//ignore unresolved variable
		return w.Write([]byte("$[[" + tag + "]]"))
	})
	br := bytes.NewReader([]byte(output))
	scanner := bufio.NewScanner(br)
	scanner.Buffer(make([]byte, 10*1024*1024), 10*1024*1024)
	scanner.Split(bufio.ScanLines)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	if request.Cluster.Endpoint != "" && request.Cluster.Host == "" {
		uri, err := uri2.Parse(request.Cluster.Endpoint)
		if err != nil {
			panic(err)
		}
		request.Cluster.Host = uri.Host
		request.Cluster.Schema = uri.Scheme
	}
	var setupHTTPPool = fasthttp.NewRequestResponsePool("setup")
	req := setupHTTPPool.AcquireRequest()
	res := setupHTTPPool.AcquireResponse()

	defer setupHTTPPool.ReleaseRequest(req)
	defer setupHTTPPool.ReleaseResponse(res)

	_, err, _ = replay.ReplayLines(req, res, pipeline.AcquireContext(pipeline.PipelineConfigV2{}), lines, request.Cluster.Schema, request.Cluster.Host, request.Cluster.Username, request.Cluster.Password)
	if err != nil {
		module.WriteJSON(w, util.MapStr{
			"success": false,
			"log":     fmt.Sprintf("initalize template [%s] error: ", err.Error()),
		}, http.StatusOK)
		return
	}
	module.WriteJSON(w, util.MapStr{
		"success": true,
		"log":     fmt.Sprintf("initalize template [%s] succeed", request.InitializeTemplate),
	}, http.StatusOK)

}
