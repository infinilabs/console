package common

import "strings"

func ResolveSender(sender, username string) string {
	sender = strings.TrimSpace(sender)
	if sender != "" {
		return sender
	}
	return strings.TrimSpace(username)
}
