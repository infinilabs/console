package notification

import (
	"infini.sh/console/core"
	"infini.sh/framework/core/api"
)

type NotificationAPI struct {
	core.Handler
}

func InitAPI() {
	notification := NotificationAPI{}
	api.HandleAPIMethod(api.POST, "/notification/_search", notification.RequireLogin(notification.searchNotifications))
	api.HandleAPIMethod(api.POST, "/notification/read", notification.RequireLogin(notification.setNotificationsRead))
}
