package action

import (
	"infini.sh/search-center/model/alerting"
	"net/http"
	"testing"
)

func TestWebhookAction(t *testing.T){
	ea := WebhookAction{
		Message: `{"msgtype": "text","text": {"content":"通知：我就是我, 是不一样的烟火,Trigger: {{ctx.trigger.name}}"},"at":{"atMobiles":["18692254900"],"isAtAll": false}}`,
		Data: &alerting.CustomWebhook{
			HeaderParams: map[string]string{
				"Content-Type": "application/json",
			},
			URL: "https://oapi.dingtalk.com/robot/send?access_token=6a5c7c9454ff74537a6de493153b1da68860942d4b0aeb33797cb68b5111b077",
			Method: http.MethodPost,
		},
	}
	_, err := ea.Execute()
	if err != nil {
		t.Fatal(err)
	}

}