package notification

import (
	"infini.sh/framework/core/api"
)

type NotificationAPI struct {
	api.Handler
}

func InitAPI() {
	notification := NotificationAPI{}
	api.HandleAPIMethod(api.GET, "/notification", notification.RequireLogin(notification.listNotifications))
}
