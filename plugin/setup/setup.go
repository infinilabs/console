package task

import (
	"bytes"
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/module"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/pipeline"
	"infini.sh/framework/core/util"
	elastic2 "infini.sh/framework/modules/elastic"
	elastic1 "infini.sh/framework/modules/elastic/common"
	elastic3 "infini.sh/framework/modules/elastic/api"
	"infini.sh/framework/modules/security"
	"infini.sh/framework/plugins/replay"
	"io"
	"net/http"
	uri2 "net/url"
	"path"
	"path/filepath"
	"runtime"
	"github.com/valyala/fasttemplate"
	log "github.com/cihub/seelog"
	"time"
)

type Module struct {
	api.Handler
}

func (module *Module) Name() string {
	return "setup"
}

func init()  {
	module.RegisterSystemModule(&Module{})
}

func (module *Module) Setup() {

	if !global.Env().SetupRequired(){
		return
	}

	api.HandleAPIMethod(api.POST, "/setup/_validate", module.validate)
	api.HandleAPIMethod(api.POST, "/setup/_initialize", module.initialize)
	elastic3.InitTestAPI()
}

var setupFinishedCallback= []func() {}
func RegisterSetupCallback(f func()) {
	setupFinishedCallback=append(setupFinishedCallback,f)
}

func InvokeSetupCallback()  {
	for _,v:=range setupFinishedCallback{
		v()
	}
}

func (module *Module) Start() error {
	return nil
}
func (module *Module) Stop() error {
	return nil
}

type SetupRequest struct {
	Cluster struct {
		Host string `json:"host"`
		Schema string `json:"schema"`
		Endpoint string `json:"endpoint"`
		Username string `json:"username"`
		Password string `json:"password"`
	} `json:"cluster"`

	Skip bool `json:"skip"`
	BootstrapUsername string `json:"bootstrap_username"`
	BootstrapPassword string `json:"bootstrap_password"`
}

var tempID="infini_default_system_cluster"

const VersionTooOld ="elasticsearch_version_too_old"
const IndicesExists ="elasticsearch_indices_exists"
const TemplateExists ="elasticsearch_template_exists"

var cfg1 elastic1.ORMConfig

func (module *Module) validate(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

	if !global.Env().SetupRequired(){
		module.WriteError(w, "setup not permitted", 500)
		return
	}

	success:=false
	var err error
	var errType string
	var fixTips string
	var code int
	code=200
	defer func() {

		global.Env().CheckSetup()

		result := util.MapStr{}
		result["success"]=success

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
			if v!=""{
				success=false
				result["error"]=util.MapStr{
					"reason":v,
				}
				if errType!=""{
					result["type"]=errType
				}
				if fixTips!=""{
					result["fix_tips"]=fixTips
				}
				code=500
			}
		}
		module.WriteJSON(w, result, code)
	}()


	err, client,_ := module.initTempClient(r)
	if err!=nil{
		panic(err)
	}

	//validate version
	version := client.GetVersion()
	if version != "" {
		ver := &util.Version{}
		ver, err = util.ParseSemantic(version)
		if err != nil {
			panic(err)
		}
		if ver.Major() >= 7 {
			if ver.Major() == 7 && ver.Minor() < 3 {
				errType = VersionTooOld
				panic(errors.Errorf("elasticsearch version(%v) should greater than v7.3", version))
			}
		} else {
			errType = VersionTooOld
			panic(errors.Errorf("elasticsearch version(%v) should greater than v7.3", version))
		}
	}
	cfg1 = elastic1.ORMConfig{}
	exist, err := env.ParseConfig("elastic.orm", &cfg1)
	if exist && err != nil {
		panic(err)
	}

	if cfg1.IndexPrefix==""{
		cfg1.IndexPrefix=".infini_"
	}
	if cfg1.TemplateName==""{
		cfg1.TemplateName=".infini"
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
		fixTips=tipBuff.String()
		panic(errors.Errorf("there are following indices exists in target elasticsearch: \n%v", buff.String()))
	}

	ok, err := client.TemplateExists(cfg1.TemplateName)
	if err != nil {
		panic(err)
	}
	if ok {
		errType = TemplateExists
		fixTips="DELETE /_template/"+util.TrimSpaces(cfg1.TemplateName)
		panic(errors.Errorf("there are following template already exists in target elasticsearch: \n%v", cfg1.TemplateName))
	}

	success = true
}
var cfg elastic.ElasticsearchConfig
func (module *Module) initTempClient(r *http.Request) (error, elastic.API,SetupRequest) {
	request := SetupRequest{}
	err := module.DecodeJSON(r, &request)
	if err != nil {
		return err,nil,request
	}

	if request.Cluster.Endpoint==""&&request.Cluster.Host==""{
		panic("invalid configuration")
	}

	if request.Cluster.Endpoint==""{
		if request.Cluster.Host!=""&&request.Cluster.Schema!=""{
			request.Cluster.Endpoint=fmt.Sprintf("%v://%v",request.Cluster.Schema,request.Cluster.Host)
		}
	}

	cfg = elastic.ElasticsearchConfig{
		Enabled:  true,
		Reserved: true,
		Endpoint: request.Cluster.Endpoint,
		BasicAuth: &elastic.BasicAuth{
			Username: request.Cluster.Username,
			Password: request.Cluster.Password,
		},
	}

	if cfg.Endpoint!=""&&cfg.Host==""{
		uri,err:=uri2.Parse(cfg.Endpoint)
		if err!=nil{
			panic(err)
		}
		cfg.Host=uri.Host
		cfg.Schema=uri.Scheme
	}


	cfg.ID = tempID
	cfg.Name = "INFINI_SYSTEM ("+util.PickRandomName()+")"
	elastic.InitMetadata(&cfg, true)
	client, err := elastic1.InitClientWithConfig(cfg)
	if err != nil {
		return err,nil,request
	}

	global.Register(elastic.GlobalSystemElasticsearchID,tempID)

	elastic.UpdateConfig(cfg)
	elastic.UpdateClient(cfg, client)
	health, err := client.ClusterHealth()
	if err != nil {
		return err,nil,request
	}
	if health != nil {
		cfg.RawName = health.Name
	}
	cfg.Version=client.GetVersion()

	return err, client,request
}

func (module *Module) initialize(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	if !global.Env().SetupRequired(){
		module.WriteError(w, "setup not permitted", 500)
		return
	}

	success:=false
	var err error
	var errType string
	var fixTips string
	var code int
	code=200
	defer func() {

		global.Env().CheckSetup()

		result := util.MapStr{}
		result["success"]=success

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
			if v!=""{
				success=false
				result["error"]=util.MapStr{
					"reason":v,
				}
				if errType!=""{
					result["type"]=errType
				}
				if fixTips!=""{
					result["fix_tips"]=fixTips
				}
				code=500
			}
		}
		module.WriteJSON(w, result, code)
	}()

	err, client,request := module.initTempClient(r)
	if err!=nil{
		panic(err)
	}

	if cfg1.IndexPrefix==""{
		cfg1.IndexPrefix=".infini_"
	}
	if cfg1.TemplateName==""{
		cfg1.TemplateName=".infini"
	}

	if !cfg1.Enabled{
		cfg1.Enabled=true
	}

	if !cfg1.InitTemplate{
		cfg1.InitTemplate=true
	}

	cfg.Reserved=true
	cfg.Monitored=true

	//处理ORM
	handler := elastic2.ElasticORM{Client: client, Config:cfg1 }
	orm.Register("elastic_setup_"+util.GetUUID(), handler)

	if !request.Skip{
		//处理模版
		elastic2.InitTemplate(true)

		//处理生命周期
		//TEMPLATE_NAME
		//INDEX_PREFIX
		dslTplFile:=path.Join(global.Env().GetConfigDir(),"initialization.tpl")
		dslFile:=path.Join(global.Env().GetConfigDir(),"initialization.dsl")

		if !util.FileExists(dslTplFile){
			log.Error(filepath.Abs(dslTplFile))
			panic("template file for setup was missing")
		}

		var dsl []byte
		dsl,err=util.FileGetContent(dslTplFile)
		if err!=nil{
			panic(err)
		}

		var dslWriteSuccess=false
		if len(dsl)>0{
			var tpl *fasttemplate.Template
			tpl,err=fasttemplate.NewTemplate(string(dsl), "$[[", "]]")
			if err!=nil{
				panic(err)
			}
			if tpl!=nil{
				output:=tpl.ExecuteFuncString(func(w io.Writer, tag string) (int, error) {
					switch tag {
					case "TEMPLATE_NAME":
						return w.Write([]byte(cfg1.TemplateName))
					case "INDEX_PREFIX":
						return w.Write([]byte(cfg1.IndexPrefix))
					case "RESOURCE_ID":
						return w.Write([]byte(cfg.ID))
					case "RESOURCE_NAME":
						return w.Write([]byte(cfg.Name))
					}
					panic(errors.Errorf("unknown tag: %v",tag))
				})
				_,err=util.FilePutContent(dslFile,output)
				if err!=nil{
					panic(err)
				}
				dslWriteSuccess=true
			}
		}

		if dslWriteSuccess{
			lines := util.FileGetLines(dslFile)
			_,err,_:=replay.ReplayLines(pipeline.AcquireContext(),lines,cfg.Schema,cfg.Host)
			if err!=nil{
				log.Error(err)
			}
		}

		//处理索引
		elastic2.InitSchema()
		//init security
		security.InitSecurity()

		//保存默认集群
		err=orm.Save(&cfg)
		if err!=nil{
			panic(err)
		}

		if request.BootstrapUsername!=""&&request.BootstrapPassword!=""{
			//Save bootstrap user
			user:=rbac.User{}
			user.ID="default_user_"+request.BootstrapUsername
			user.Name=request.BootstrapUsername
			user.NickName=request.BootstrapUsername
			var hash []byte
			hash, err = bcrypt.GenerateFromPassword([]byte(request.BootstrapPassword), bcrypt.DefaultCost)
			if err!=nil{
				panic(err)
			}

			user.Password=string(hash)
			role:=[]rbac.UserRole{}
			role=append(role,rbac.UserRole{
				ID: rbac.RoleAdminName,
				Name: rbac.RoleAdminName,
			})
			user.Roles=role
			err=orm.Save(&user)
			if err!=nil{
				panic(err)
			}
		}


		//disable builtin auth
		err=api.DisableBuiltinUserAdmin()
		if err!=nil{
			panic(err)
		}

	}


	//save to local file
	file:=path.Join(global.Env().GetConfigDir(),"system_config.yml")
	_,err=util.FilePutContent(file,fmt.Sprintf("configs.template:\n  - name: \"system\"\n    path: ./config/system_config.tpl\n    variable:\n      " +
		"CLUSTER_ID: %v\n      CLUSTER_ENDPINT: \"%v\"\n      " +
		"CLUSTER_USER: \"%v\"\n      CLUSTER_PASS: \"%v\"\n      CLUSTER_VER: \"%v\"\n      INDEX_PREFIX: \"%v\"",
	tempID,cfg.Endpoint,cfg.BasicAuth.Username,cfg.BasicAuth.Password,cfg.Version,cfg1.IndexPrefix	))
	if err!=nil{
		panic(err)
	}

	//callback
	InvokeSetupCallback()

	//place setup lock file
	setupLock:=path.Join(global.Env().GetDataDir(),".setup_lock")
	_,err=util.FilePutContent(setupLock,time.Now().String())
	if err!=nil{
		panic(err)
	}

	success=true

}