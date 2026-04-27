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

package email

import (
	"fmt"
	"io"
	"time"

	log "github.com/cihub/seelog"
	"github.com/gopkg.in/gomail.v2"
	"infini.sh/console/model"
	emailcommon "infini.sh/console/plugin/api/email/common"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/param"
	"infini.sh/framework/core/pipeline"
	"infini.sh/framework/core/queue"
	"infini.sh/framework/core/util"
	"infini.sh/framework/lib/fasttemplate"
)

type EmailProcessor struct {
	config *EmailProcessorConfig
}

type EmailServerConfig struct {
	Server struct {
		Host string `config:"host"`
		Port int    `config:"port"`
		TLS  bool   `config:"tls"`
	} `config:"server"`
	Auth struct {
		Username string `config:"username"`
		Password string `config:"password"`
	} `config:"auth"`
	MinTLSVersion string `config:"min_tls_version"`
	SendFrom      string `config:"sender"`
	Recipients    struct {
		To  []string `config:"to"`
		CC  []string `config:"cc"`
		BCC []string `config:"bcc"`
	} `config:"recipients"`
}

type EmailTemplate struct {
	ContentType       string `config:"content_type"`
	Subject           string `config:"subject"`
	Body              string `config:"body"`
	variableInSubject bool
	variableInBody    bool
	bodyTemplate      *fasttemplate.Template
	subjectTemplate   *fasttemplate.Template
}

type EmailProcessorConfig struct {
	DialTimeoutInSeconds int                           `config:"dial_timeout_in_seconds"`
	MessageField         param.ParaKey                 `config:"message_field"`
	VariableStartTag     string                        `config:"variable_start_tag"`
	VariableEndTag       string                        `config:"variable_end_tag"`
	Variables            map[string]interface{}        `config:"variables"`
	Servers              map[string]*EmailServerConfig `config:"servers"`
	Templates            map[string]*EmailTemplate     `config:"templates"`
}

var loadEmailServerForProcessor = queryEnabledEmailServerConfigByID
var loadEmailServersForProcessor = queryEnabledEmailServerConfigs

func (processor *EmailProcessor) Name() string {
	return "console_smtp"
}

func init() {
	pipeline.RegisterProcessorPlugin("console_smtp", newEmailProcessor)
}

func newEmailProcessor(c *config.Config) (pipeline.Processor, error) {
	cfg := EmailProcessorConfig{
		DialTimeoutInSeconds: 30,
		VariableStartTag:     "$[[",
		VariableEndTag:       "]]",
		MessageField:         "messages",
	}
	if err := c.Unpack(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unpack console_smtp processor config: %s", err)
	}

	processor := &EmailProcessor{config: &cfg}
	for _, server := range processor.config.Servers {
		normalizeEmailServerConfig(server)
	}

	for _, tpl := range processor.config.Templates {
		if util.ContainStr(tpl.Body, processor.config.VariableStartTag) {
			tpl.variableInBody = true
			template, err := fasttemplate.NewTemplate(tpl.Body, processor.config.VariableStartTag, processor.config.VariableEndTag)
			if err != nil {
				return nil, err
			}
			tpl.bodyTemplate = template
		}
		if util.ContainStr(tpl.Subject, processor.config.VariableStartTag) {
			tpl.variableInSubject = true
			template, err := fasttemplate.NewTemplate(tpl.Subject, processor.config.VariableStartTag, processor.config.VariableEndTag)
			if err != nil {
				return nil, err
			}
			tpl.subjectTemplate = template
		}
	}

	return processor, nil
}

func (processor *EmailProcessor) Process(ctx *pipeline.Context) error {
	obj := ctx.Get(processor.config.MessageField)
	if obj == nil {
		return nil
	}

	messages, ok := obj.([]queue.Message)
	if !ok || len(messages) == 0 {
		return nil
	}

	for _, message := range messages {
		payload := util.MapStr{}
		if err := util.FromJSONBytes(message.Data, &payload); err != nil {
			return err
		}

		vars := toMapStr(payload["variables"])
		serverID := util.ToString(payload["server_id"])
		if serverID == "" {
			serverID = util.ToString(processor.config.Variables["server_id"])
		}
		if serverID == "" {
			return errors.New("server_id is empty")
		}

		resolvedServerID, server, err := processor.resolveServer(serverID)
		if err != nil {
			return err
		}

		templateName := util.ToString(payload["template"])
		if templateName == "" {
			templateName = "raw"
		}
		tpl, ok := processor.config.Templates[templateName]
		if !ok || tpl == nil {
			return errors.Errorf("template [%v] not found", templateName)
		}

		sendTo := append(readStringList(payload["email"]), server.Recipients.To...)
		if len(sendTo) == 0 {
			sendTo = append(sendTo, readStringList(vars["email"])...)
		}
		if len(sendTo) == 0 {
			log.Errorf("skip email message without recipients, server_id: %v", resolvedServerID)
			continue
		}

		cc := append([]string{}, server.Recipients.CC...)
		cc = append(cc, readStringList(vars["cc"])...)

		mergedVars := util.MapStr{}
		mergedVars.Merge(processor.config.Variables)
		mergedVars.Merge(vars)

		subject := processor.renderTemplate(tpl.subjectTemplate, tpl.variableInSubject, tpl.Subject, mergedVars)
		body := processor.renderTemplate(tpl.bodyTemplate, tpl.variableInBody, tpl.Body, mergedVars)
		contentType := tpl.ContentType
		if override := util.ToString(vars["content_type"]); override != "" {
			contentType = override
		}

		log.Debugf("start to send mail to: %v, subject: %v", sendTo, subject)
		if err := processor.send(server, sendTo, cc, subject, contentType, body); err != nil {
			return err
		}
	}

	return nil
}

func normalizeEmailServerConfig(server *EmailServerConfig) {
	if server == nil {
		return
	}
	if server.Auth.Username == "" && server.SendFrom != "" {
		server.Auth.Username = server.SendFrom
	}
	if server.SendFrom == "" && server.Auth.Username != "" {
		server.SendFrom = server.Auth.Username
	}
}

func buildEmailServerConfig(server model.EmailServer) (*EmailServerConfig, error) {
	if err := server.Validate(false); err != nil {
		return nil, err
	}
	auth, err := emailcommon.GetBasicAuth(&server)
	if err != nil {
		return nil, err
	}
	cfg := &EmailServerConfig{
		MinTLSVersion: server.TLSMinVersion,
	}
	cfg.Server.Host = server.Host
	cfg.Server.Port = server.Port
	cfg.Server.TLS = server.TLS
	cfg.Auth.Username = auth.Username
	cfg.Auth.Password = auth.Password.Get()
	normalizeEmailServerConfig(cfg)
	return cfg, nil
}

func queryEnabledEmailServerConfigByID(serverID string) (*EmailServerConfig, error) {
	if serverID == "" {
		return nil, nil
	}
	server := model.EmailServer{}
	server.ID = serverID
	exists, err := orm.Get(&server)
	if err != nil {
		return nil, err
	}
	if !exists || !server.Enabled {
		return nil, nil
	}
	return buildEmailServerConfig(server)
}

func queryEnabledEmailServerConfigs() (map[string]*EmailServerConfig, error) {
	q := &orm.Query{Size: 100}
	q.Conds = orm.And(orm.Eq("enabled", true))
	err, result := orm.Search(model.EmailServer{}, q)
	if err != nil {
		return nil, err
	}
	servers := map[string]*EmailServerConfig{}
	for _, row := range result.Result {
		server := model.EmailServer{}
		buf := util.MustToJSONBytes(row)
		util.MustFromJSONBytes(buf, &server)
		cfg, err := buildEmailServerConfig(server)
		if err != nil {
			return nil, err
		}
		servers[server.ID] = cfg
	}
	return servers, nil
}

func (processor *EmailProcessor) resolveServer(serverID string) (string, *EmailServerConfig, error) {
	if server, ok := processor.config.Servers[serverID]; ok && server != nil {
		return serverID, server, nil
	}
	server, err := loadEmailServerForProcessor(serverID)
	if err != nil {
		return "", nil, err
	}
	if server != nil {
		return serverID, server, nil
	}
	servers, err := loadEmailServersForProcessor()
	if err != nil {
		return "", nil, err
	}
	switch len(servers) {
	case 0:
		return "", nil, errors.Errorf("server_id [%v] not found and no enabled smtp server is available", serverID)
	case 1:
		for id, fallback := range servers {
			return id, fallback, nil
		}
	default:
		return "", nil, errors.Errorf("server_id [%v] not found and multiple enabled smtp servers were found", serverID)
	}
	return "", nil, errors.Errorf("server_id [%v] not found", serverID)
}

func (processor *EmailProcessor) renderTemplate(tpl *fasttemplate.Template, enabled bool, raw string, vars util.MapStr) string {
	if !enabled || tpl == nil {
		return raw
	}

	return tpl.ExecuteFuncString(func(w io.Writer, tag string) (int, error) {
		value, err := vars.GetValue(tag)
		if err != nil {
			return -1, err
		}
		text := util.ToString(value)
		if text == "" {
			return 0, nil
		}
		return w.Write([]byte(text))
	})
}

func (processor *EmailProcessor) send(server *EmailServerConfig, to []string, cc []string, subject, contentType, body string) error {
	if len(to) == 0 {
		return errors.New("no recipient found")
	}

	message := gomail.NewMessage()
	message.SetHeader("From", server.SendFrom)
	message.SetHeader("To", to...)
	if len(cc) > 0 {
		message.SetHeader("Cc", cc...)
	}
	if len(server.Recipients.BCC) > 0 {
		message.SetHeader("Bcc", server.Recipients.BCC...)
	}
	message.SetHeader("Subject", subject)
	message.SetBody(contentType, body)

	minVersion := model.TLSVersion12
	if server.MinTLSVersion != "" {
		minVersion = server.MinTLSVersion
	}
	tlsMinVersion, err := model.GetTLSVersion(minVersion)
	if err != nil {
		return err
	}

	d := gomail.NewDialerWithTimeout(
		server.Server.Host,
		server.Server.Port,
		server.Auth.Username,
		server.Auth.Password,
		time.Duration(processor.config.DialTimeoutInSeconds)*time.Second,
	)
	d.TLSConfig = newEmailTLSConfig(server.Server.Host, tlsMinVersion)
	d.SSL = server.Server.TLS
	return d.DialAndSend(message)
}

func readStringList(value interface{}) []string {
	switch v := value.(type) {
	case string:
		if v == "" {
			return nil
		}
		return []string{v}
	case []string:
		list := make([]string, 0, len(v))
		for _, item := range v {
			if item != "" {
				list = append(list, item)
			}
		}
		return list
	case []interface{}:
		list := make([]string, 0, len(v))
		for _, item := range v {
			text := util.ToString(item)
			if text != "" {
				list = append(list, text)
			}
		}
		return list
	default:
		return nil
	}
}

func toMapStr(value interface{}) util.MapStr {
	switch v := value.(type) {
	case util.MapStr:
		return v
	case map[string]interface{}:
		return util.MapStr(v)
	default:
		return util.MapStr{}
	}
}
