/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"bytes"
	"fmt"
	"infini.sh/console/model/alerting"
	"infini.sh/console/service/alerting/action"
	"infini.sh/console/service/alerting/funcs"
	"infini.sh/framework/core/orm"
	"text/template"
)

func PerformChannel(channel *alerting.Channel, ctx map[string]interface{}) ([]byte, error, []byte) {
	if channel == nil {
		return nil, fmt.Errorf("empty channel"), nil
	}
	var (
		act action.Action
		message []byte
		err error
	)
	switch channel.Type {

	case alerting.ChannelWebhook:
		message, err = ResolveMessage(channel.Webhook.Body, ctx)
		if err != nil {
			return nil, err, message
		}
		wh := *channel.Webhook
		urlBytes, err := ResolveMessage(wh.URL, ctx)
		if err != nil {
			return nil, err, message
		}
		wh.URL = string(urlBytes)
		act = &action.WebhookAction{
			Data:    &wh,
			Message: string(message),
		}
	case alerting.ChannelEmail:
		message, err = ResolveMessage(channel.Email.Body, ctx)
		if err != nil {
			return nil, err, message
		}
		subjectBytes, err := ResolveMessage(channel.Email.Subject, ctx)
		if err != nil {
			return nil, err, nil
		}
		act = &action.EmailAction{
			Data:    channel.Email,
			Subject: string(subjectBytes),
			Body: string(message),
		}
	default:
		return nil, fmt.Errorf("unsupported action type: %s", channel.Type), message
	}
	executeResult, err := act.Execute()
	return executeResult, err, message
}

func ResolveMessage(messageTemplate string, ctx map[string]interface{}) ([]byte, error){
	msg :=  messageTemplate
	tmpl, err := template.New("alert-message").Funcs(funcs.GenericFuncMap()).Parse(msg)
	if err !=nil {
		return nil, fmt.Errorf("parse message temlate error: %w", err)
	}
	msgBuffer := &bytes.Buffer{}
	err = tmpl.Execute(msgBuffer, ctx)
	return msgBuffer.Bytes(), err
}

func RetrieveChannel(ch *alerting.Channel) (*alerting.Channel, error) {
	if ch == nil {
		return nil, fmt.Errorf("empty channel")
	}
	if ch.ID != "" {
		refCh := &alerting.Channel{}
		_, err := orm.Get(refCh)
		if err != nil {
			return nil, err
		}
		ch.Type = refCh.Type
		ch.Name = refCh.Name
		ch.SubType = refCh.SubType
		switch ch.Type {
		case alerting.ChannelEmail:
			if ch.Email == nil {
				ch.Email = refCh.Email
			}else{
				ch.Email.ServerID = refCh.Email.ServerID
				ch.Email.Recipients = refCh.Email.Recipients
			}
		case alerting.ChannelWebhook:
			if ch.Webhook == nil {
				ch.Webhook = refCh.Webhook
			}
		}
	}
	return ch, nil
}