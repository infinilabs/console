package action

import (
	"crypto/tls"
	"fmt"
	"infini.sh/console/model/alerting"
	"io/ioutil"
	"net/http"
	"strings"
)

type Action interface {
	Execute() ([]byte, error)
}

type WebhookAction struct {
	Data *alerting.CustomWebhook
	Message string
}

var actionClient = http.Client{
	Transport: &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	},
}

func (act *WebhookAction) Execute()([]byte, error){
	var reqURL string
	if act.Data.URL != "" {
		reqURL = act.Data.URL
	}
	if act.Data.Host != "" {
		reqURL = fmt.Sprintf("%s://%s:%d/%s", act.Data.Scheme, act.Data.Host, act.Data.Port, act.Data.Path )
		urlBuilder := strings.Builder{}
		urlBuilder.WriteString(reqURL)
		if len(act.Data.QueryParams) > 0 {
			urlBuilder.WriteString("?")
		}
		for k, v := range act.Data.QueryParams {
			urlBuilder.WriteString(k)
			urlBuilder.WriteString("=")
			urlBuilder.WriteString(v)
			urlBuilder.WriteString("&")
		}
		reqURL = urlBuilder.String()
	}
	reqBody := strings.NewReader(act.Message)
	req, err := http.NewRequest(http.MethodPost, reqURL, reqBody)
	if err != nil {
		return nil, err
	}
	for key, value := range act.Data.HeaderParams {
		req.Header.Add(key, value)
	}
	res, err := actionClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	return ioutil.ReadAll(res.Body)
}

