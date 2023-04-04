package notification

import (
	"infini.sh/framework/core/api"
)

type NotificationAPI struct {
	api.Handler
}

func InitAPI() {
	notification := NotificationAPI{}
	api.HandleAPIMethod(api.POST, "/notification/_search", notification.RequireLogin(notification.searchNotifications))
	api.HandleAPIMethod(api.POST, "/notification/read", notification.RequireLogin(notification.setNotificationsRead))
}
