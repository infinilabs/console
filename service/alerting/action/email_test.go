package action

import (
	"infini.sh/search-center/model/alerting"
	"testing"
)

func TestEmailAction(t *testing.T){
	ea := EmailAction{
		Sender: &alerting.EmailAccount{
			Email: "liugq@infini.ltd",
			Host: "smtp.ym.163.com",
			Port: 994,
			Method: "ssl",
			Password: "<your email password>",
		},
		Message: "hello world",
		Subject: "test email",
		Receiver: []string{"786027438@qq.com"},
	}
	_, err := ea.Execute()
	if err != nil {
		t.Fatal(err)
	}
}