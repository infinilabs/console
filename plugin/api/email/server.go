/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package email

import (
	"bytes"
	"crypto/tls"
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/model"
	"infini.sh/console/model/alerting"
	"infini.sh/console/plugin/api/email/common"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"github.com/buger/jsonparser"
	"github.com/gopkg.in/gomail.v2"
	"strconv"
	"time"
)

func (h *EmailAPI) createEmailServer(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var obj = &model.EmailServer{}
	err := h.DecodeJSON(req, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	q := util.MapStr{
		"size": 1,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"host": util.MapStr{
								"value": obj.Host,
							},
						},
					},
					{
						"term": util.MapStr{
							"port": util.MapStr{
								"value": obj.Port,
							},
						},
					},
				},
			},
		},
	}
	query := orm.Query{
		RawQuery: util.MustToJSONBytes(q),
	}
	err, result := orm.Search(obj, &query)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if len(result.Result) > 0 {
		h.WriteError(w, fmt.Sprintf("email server [%s:%d] already exists", obj.Host, obj.Port), http.StatusInternalServerError)
		return
	}
	if obj.CredentialID == "" && obj.Auth != nil && obj.Auth.Username != ""{
		credentialID, err := saveBasicAuthToCredential(obj)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		obj.CredentialID = credentialID
	}
	obj.Auth = nil

	err = orm.Create(&orm.Context{
		Refresh: "wait_for",
	}, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if obj.Enabled {
		err = common.RefreshEmailServer()
		if err != nil {
			log.Error(err)
		}
	}

	h.WriteCreatedOKJSON(w, obj.ID)

}

func saveBasicAuthToCredential(srv *model.EmailServer)(string, error){
	if srv == nil {
		return "", fmt.Errorf("param email config can not be empty")
	}
	cred := credential.Credential{
		Name: srv.Name,
		Type: credential.BasicAuth,
		Tags: []string{"Email"},
		Payload: map[string]interface{}{
			"basic_auth": map[string]interface{}{
				"username": srv.Auth.Username,
				"password": srv.Auth.Password,
			},
		},
	}
	cred.ID = util.GetUUID()
	err := cred.Encode()
	if err != nil {
		return "", err
	}
	err = orm.Create(nil, &cred)
	if err != nil {
		return "", err
	}
	return cred.ID, nil
}

func (h *EmailAPI) getEmailServer(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("email_server_id")

	obj := model.EmailServer{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteGetOKJSON(w, id, obj)
}

func (h *EmailAPI) updateEmailServer(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("email_server_id")
	obj := model.EmailServer{}

	obj.ID = id
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	id = obj.ID
	create := obj.Created
	newObj := model.EmailServer{}
	err = h.DecodeJSON(req, &newObj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if !newObj.Enabled && obj.Enabled {
		if err = checkEmailServerReferenced(&obj); err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			log.Error(err)
			return
		}
	}
	if newObj.Auth != nil && newObj.CredentialID == "" {
		credentialID, err := saveBasicAuthToCredential(&newObj)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		newObj.CredentialID = credentialID
		newObj.Auth = nil
	}

	//protect
	newObj.ID = id
	newObj.Created = create
	err = orm.Update(&orm.Context{
		Refresh: "wait_for",
	}, &newObj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	err = common.RefreshEmailServer()
	if err != nil {
		log.Error(err)
	}

	h.WriteUpdatedOKJSON(w, obj.ID)
}

func (h *EmailAPI) deleteEmailServer(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("email_server_id")

	obj := model.EmailServer{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}
	if err = checkEmailServerReferenced(&obj); err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	err = orm.Delete(&orm.Context{
		Refresh: "wait_for",
	}, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if obj.Enabled {
		err = common.RefreshEmailServer()
		if err != nil {
			log.Error(err)
		}
	}

	h.WriteDeletedOKJSON(w, obj.ID)
}

func checkEmailServerReferenced(srv *model.EmailServer) error {
	q := &orm.Query{
		Size: 1,
	}
	q.Conds = orm.And(orm.Eq("email.server_id", srv.ID))
	err, result := orm.Search(alerting.Channel{}, q)
	if err != nil {
		return err
	}
	if len(result.Result) > 0 {
		var chName interface{} = ""
		if m, ok := result.Result[0].(map[string]interface{}); ok {
			chName = m["name"]
		}
		return fmt.Errorf("email server used by channel [%s]", chName)
	}
	return nil
}

func (h *EmailAPI) searchEmailServer(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var (
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		strEnabled = h.GetParameterOrDefault(req, "enabled", "true")
	)
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	q := orm.Query{
		From: from,
		Size: size,
	}
	if strEnabled == "true" {
		q.Conds = orm.And(orm.Eq("enabled", true))
	}else if strEnabled == "false" {
		q.Conds = orm.And(orm.Eq("enabled", false))
	}

	err, res := orm.Search(&model.EmailServer{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//remove password field
	hitsBuf := bytes.Buffer{}
	hitsBuf.Write([]byte("["))
	jsonparser.ArrayEach(res.Raw, func(value []byte, dataType jsonparser.ValueType, offset int, err error) {
		value = jsonparser.Delete(value, "_source", "auth", "password")
		hitsBuf.Write(value)
		hitsBuf.Write([]byte(","))
	}, "hits", "hits")
	buf := hitsBuf.Bytes()
	if buf[len(buf)-1] == ',' {
		buf[len(buf)-1] = ']'
	}else{
		hitsBuf.Write([]byte("]"))
	}
	res.Raw, err = jsonparser.Set(res.Raw, hitsBuf.Bytes(), "hits", "hits")
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	h.Write(w, res.Raw)
}

func (h *EmailAPI) testEmailServer(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	reqBody := &struct {
		SendTo []string `json:"send_to"`
		model.EmailServer
	}{}
	err := h.DecodeJSON(req, reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(reqBody.SendTo) == 0 {
		h.WriteError(w, "receiver email address can not be empty", http.StatusInternalServerError)
		return
	}
	if err = reqBody.Validate(false); err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if reqBody.CredentialID != "" {
		auth, err := common.GetBasicAuth(&reqBody.EmailServer)
		if  err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		reqBody.Auth = &auth
	}
	if reqBody.Auth == nil {
		h.WriteError(w, "auth info required", http.StatusInternalServerError)
		return
	}
	message := gomail.NewMessage()
	message.SetHeader("From", reqBody.Auth.Username)
	message.SetHeader("To", reqBody.SendTo...)
	message.SetHeader("Subject", "INFINI platform test email")

	message.SetBody("text/plain", "This is just a test email, do not reply!")
	d := gomail.NewDialerWithTimeout(reqBody.Host, reqBody.Port, reqBody.Auth.Username, reqBody.Auth.Password, 3*time.Second)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}
	d.SSL = reqBody.TLS

	err = d.DialAndSend(message)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteAckOKJSON(w)
}
