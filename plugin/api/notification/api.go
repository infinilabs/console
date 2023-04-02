package notification

import (
	"infini.sh/framework/core/api"
)

type NotificationAPI struct {
	api.Handler
}

func InitAPI() {
	notification := NotificationAPI{}
	api.HandleAPIMethod(api.GET, "/notification/_search", notification.RequireLogin(notification.listNotifications))
	api.HandleAPIMethod(api.POST, "/notification/read", notification.RequireLogin(notification.setNotificationsRead))
}
