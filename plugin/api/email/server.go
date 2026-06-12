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

/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package email

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"gopkg.in/gomail.v2"
	"infini.sh/console/model"
	"infini.sh/console/model/alerting"
	"infini.sh/console/plugin/api/email/common"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

const (
	emailServerTestErrorKeyAuthRequired   = "settings.email.server.message.test.error.auth_required"
	emailServerTestErrorKeySMTPAuthFailed = "settings.email.server.message.test.error.smtp_auth_failed"
	emailServerTestErrorKeySenderMismatch = "settings.email.server.message.test.error.sender_mismatch"
	emailServerTestErrorKeyTLSRequired    = "settings.email.server.message.test.error.tls_required"
	emailServerTestErrorKeySendFailed     = "settings.email.server.message.test.error.send_failed"
)

func newEmailTLSConfig(serverName string, minVersion uint16) *tls.Config {
	return &tls.Config{
		InsecureSkipVerify: true,
		MinVersion:         minVersion,
		ServerName:         serverName,
	}
}

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
	if obj.CredentialID == "" && obj.Auth != nil && obj.Auth.Username != "" {
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

func saveBasicAuthToCredential(srv *model.EmailServer) (string, error) {
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
				"password": srv.Auth.Password.Get(),
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
		strSize    = h.GetParameterOrDefault(req, "size", "20")
		strFrom    = h.GetParameterOrDefault(req, "from", "0")
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
	} else if strEnabled == "false" {
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
	} else {
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
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		reqBody.Auth = &auth
	}
	if reqBody.Auth == nil {
		h.writeEmailServerTestError(w, emailServerTestErrorKeyAuthRequired, "auth info required", http.StatusInternalServerError)
		return
	}
	sender := common.ResolveSender(reqBody.Sender, reqBody.Auth.Username)
	message := gomail.NewMessage()
	message.SetHeader("From", sender)
	message.SetHeader("To", reqBody.SendTo...)
	message.SetHeader("Subject", "INFINI platform test email")

	message.SetBody("text/plain", "This is just a test email, do not reply!")
	d, err := newEmailTestDialer(&reqBody.EmailServer)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = d.DialAndSend(message)
	if err != nil {
		key, reason := classifyEmailServerTestSendError(&reqBody.EmailServer, sender, err)
		log.Errorf(
			"email server test send failed, host=%s, port=%d, tls=%v, tls_min_version=%s, sender=%s, error_key=%s, reason=%s, err=%v",
			reqBody.Host,
			reqBody.Port,
			reqBody.TLS,
			reqBody.TLSMinVersion,
			sender,
			key,
			reason,
			err,
		)
		h.writeEmailServerTestError(w, key, reason, http.StatusInternalServerError)
		return
	}
	h.WriteAckOKJSON(w)
}

func (h *EmailAPI) writeEmailServerTestError(w http.ResponseWriter, key, reason string, statusCode int) {
	payload := util.MapStr{
		"status": statusCode,
		"error": util.MapStr{
			"reason": reason,
		},
	}
	if key != "" {
		payload["error"].(util.MapStr)["key"] = key
	}
	h.WriteJSON(w, payload, statusCode)
}

func classifyEmailServerTestSendError(server *model.EmailServer, sender string, err error) (string, string) {
	if err == nil {
		return "", ""
	}

	rawReason := strings.TrimSpace(err.Error())
	normalizedReason := strings.ToLower(rawReason)

	if isSMTPAuthenticationError(normalizedReason) {
		authUsername := ""
		if server != nil && server.Auth != nil {
			authUsername = strings.TrimSpace(server.Auth.Username)
		}
		if authUsername != "" && sender != "" && !strings.EqualFold(strings.TrimSpace(sender), authUsername) {
			return emailServerTestErrorKeySenderMismatch, "SMTP authentication failed; some providers require the sender address to match the authenticated account or an approved alias"
		}
		return emailServerTestErrorKeySMTPAuthFailed, "SMTP authentication failed; verify the username, password, or provider authorization code"
	}

	if strings.Contains(normalizedReason, "must issue a starttls command first") {
		return emailServerTestErrorKeyTLSRequired, "SMTP server requires TLS or STARTTLS before authentication"
	}

	if strings.Contains(normalizedReason, "could not send email") {
		return emailServerTestErrorKeySendFailed, "SMTP server rejected the test email; verify the sender, recipient, and provider restrictions"
	}

	return emailServerTestErrorKeySendFailed, "Unable to send test email; verify the SMTP server address, port, TLS settings, and provider restrictions"
}

func isSMTPAuthenticationError(reason string) bool {
	reason = strings.TrimSpace(strings.ToLower(reason))
	if reason == "" {
		return false
	}
	authIndicators := []string{
		"authentication is required",
		"authentication failed",
		"auth failed",
		"535",
		"invalid login",
		"invalid credentials",
	}
	for _, indicator := range authIndicators {
		if strings.Contains(reason, indicator) {
			return true
		}
	}
	return false
}

// newEmailTestDialer keeps Console on the standard gopkg.in/gomail.v2 module.
// The vendored gomail fork exposed NewDialerWithTimeout and used an explicit 3s
// timeout here before, but the standard module does not. Test-email requests now
// inherit gomail's built-in 10s connect timeout, so keep that behavior change
// documented in this helper instead of hiding it inline at the call site.
func newEmailTestDialer(server *model.EmailServer) (*gomail.Dialer, error) {
	tlsMinVersionName := server.TLSMinVersion
	if tlsMinVersionName == "" {
		tlsMinVersionName = model.TLSVersion12
	}

	tlsMinVersion, err := model.GetTLSVersion(tlsMinVersionName)
	if err != nil {
		return nil, err
	}

	dialer := gomail.NewDialer(server.Host, server.Port, server.Auth.Username, server.Auth.Password.Get())
	dialer.TLSConfig = newEmailTLSConfig(server.Host, tlsMinVersion)
	dialer.SSL = server.TLS

	return dialer, nil
}
