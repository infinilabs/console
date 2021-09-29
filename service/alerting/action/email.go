package action

import (
	"crypto/tls"
	"fmt"
	"infini.sh/search-center/model/alerting"
	"net"
	"net/smtp"
	"strings"
)

type EmailAction struct {
	Sender *alerting.EmailAccount
	Message string
	Subject string
	Receiver []string
}

func (act *EmailAction) Execute() ([]byte, error){
	from := act.Sender.Email
	act.Sender.Host = strings.TrimSpace(act.Sender.Host)
	addr := fmt.Sprintf("%s:%d", act.Sender.Host, act.Sender.Port)
	msg := fmt.Sprintf("To: %s\r\nSubject: %s\r\n%s\r\n", strings.Join(act.Receiver, ","), act.Subject, act.Message)

	auth := smtp.PlainAuth("", from, act.Sender.Password, act.Sender.Host)
	if act.Sender.Method == "ssl" {
		err := SendEmailOverTLS(addr, auth, from, act.Receiver, []byte(msg))
		return nil, err
	}
	err := smtp.SendMail(addr, auth, from, act.Receiver, []byte(msg))

	return nil, err
}

func SendEmailOverTLS(addr string, auth smtp.Auth, from string, to []string, msg []byte) error{
	host, _, _ := net.SplitHostPort(addr)
	tlsConfig := &tls.Config {
		InsecureSkipVerify: true,
		ServerName: host,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	//dialer := &net.Dialer{
	//	Timeout: time.Second * 15,
	//}
	//conn, err := tls.DialWithDialer(dialer, "tcp", addr, tlsConfig)
	if err != nil {
		return err
	}

	c, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}

	if err = c.Auth(auth); err != nil {
		return err
	}

	// To && From
	if err = c.Mail(from); err != nil {
		return err
	}

	for _, dst := range to {
		if err = c.Rcpt(dst); err != nil {
			return err
		}
	}
	// Data
	w, err := c.Data()
	if err != nil {
		return err
	}

	_, err = w.Write(msg)
	if err != nil {
		return err
	}

	err = w.Close()
	if err != nil {
		return err
	}

	c.Quit()
	return nil
}

