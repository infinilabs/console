package enum

import (
	"time"
)

var PermissionMap = make(map[string][]string)

const (
	UserRead    = "system.user:read"
	UserAll     = "system.user:all"
	RoleRead    = "system.role:read"
	RoleAll     = "system.role:all"
	ClusterAll  = "system.cluster:all"
	ClusterRead = "system.cluster:read"
	CommandAll  = "system.command:all"
	CommandRead = "system.command:read"

	InstanceRead = "gateway.instance:read"
	InstanceAll  = "gateway.instance:all"
	EntryAll     = "gateway.entry:all"
	EntryRead    = "gateway.entry:read"
	RouterRead   = "gateway.router:read"
	RouterAll    = "gateway.router:all"
	FlowRead     = "gateway.flow:read"
	FlowAll      = "gateway.flow:all"

	IndexAll     = "data.index:all"
	IndexRead    = "data.index:read"
	ViewsAll     = "data.views:all"
	ViewsRead    = "data.views:read"
	DiscoverAll  = "data.discover:all"
	DiscoverRead = "data.discover:read"

	RuleRead    = "alerting.rule:read"
	RuleAll     = "alerting.rule:all"
	AlertRead   = "alerting.alert:read"
	AlertAll    = "alerting.alert:all"
	ChannelRead = "alerting.channel:read"
	ChannelAll  = "alerting.channel:all"

	ClusterOverviewRead = "cluster.overview:read"
	ClusterOverviewAll  = "cluster.overview:all"
	ElasticsearchRead   = "cluster.elasticsearch:read"
	ElasticsearchAll    = "cluster.elasticsearch:all"
	ActivitiesRead      = "cluster.activities:read"
	ActivitiesAll       = "cluster.activities:all"
)

var (
	UserReadPermission = []string{"user:read"}
	UserAllPermission  = []string{"user:read", "user:write"}

	RoleReadPermission = []string{"role:read"}
	RoleAllPermission  = []string{"role:read", "role:write"}

	ClusterReadPermission = []string{"cluster:read"}
	ClusterAllPermission  = []string{"cluster:read", "cluster:write"}

	CommandReadPermission = []string{"command:read"}
	CommandAllPermission  = []string{"command:read", "command:write"}

	InstanceReadPermission = []string{"instance:read"}
	InstanceAllPermission  = []string{"instance:read", "instance:write"}

	EntryReadPermission = []string{"entry:read"}
	EntryAllPermission  = []string{"entry:read", "entry:write"}

	RouterReadPermission = []string{"router:read"}
	RouterAllPermission  = []string{"router:read", "entry:write"}

	FlowReadPermission = []string{"flow:read"}
	FlowAllPermission  = []string{"flow:read", "flow:write"}

	IndexAllPermission     = []string{"index:read"}
	IndexReadPermission    = []string{"index:read", "index:write"}
	ViewsAllPermission     = []string{"views:read"}
	ViewsReadPermission    = []string{"views:read", "views:write"}
	DiscoverReadPermission = []string{"discover:read"}
	DiscoverAllPermission  = []string{"discover:read", "discover:write"}

	RuleReadPermission    = []string{"rule:read"}
	RuleAllPermission     = []string{"rule:read", "rule:write"}
	AlertReadPermission   = []string{"alert:read"}
	AlertAllPermission    = []string{"alert:read", "alert:write"}
	ChannelReadPermssion  = []string{"channel:read"}
	ChannnelAllPermission = []string{"channel:read", "channel:write"}

	ClusterOverviewReadPermission = []string{"clusterOverview:read"}
	ClusterOverviewAllPermission  = []string{"clusterOverview:read", "clusterOverview:write"}

	ElasticsearchReadPermission = []string{"elasticsearch:read"}
	ElasticsearchAllPermission  = []string{"elasticsearch:read", "elasticsearch:write"}

	ActivitiesReadPermission = []string{"activities:read"}
	ActivitiesAllPermission  = []string{"activities:read", "activities:write"}
)

var AdminPrivilege = []string{
	UserAll, RoleAll, ClusterAll, CommandAll,
	InstanceAll, EntryAll, RouterAll, FlowAll,
	IndexAll, ViewsAll, DiscoverAll,
	RuleAll, AlertAll, ChannelAll,
	ClusterOverviewAll, ElasticsearchAll, ActivitiesAll,
}

var BuildRoles = make(map[string]map[string]interface{}, 0)

func init() {

	BuildRoles["admin"] = map[string]interface{}{
		"id":          "admin",
		"name":        "管理员",
		"type":        "console",
		"platform":    AdminPrivilege,
		"builtin":     true,
		"description": "is admin",
		"created":     time.Now(),
	}
	PermissionMap = map[string][]string{
		UserRead:    UserReadPermission,
		UserAll:     UserAllPermission,
		RoleRead:    RoleReadPermission,
		RoleAll:     RoleAllPermission,
		ClusterRead: ClusterReadPermission,
		ClusterAll:  ClusterAllPermission,
		CommandRead: CommandReadPermission,
		CommandAll:  CommandAllPermission,

		InstanceRead: InstanceReadPermission,
		InstanceAll:  InstanceAllPermission,
		EntryRead:    EntryReadPermission,
		EntryAll:     EntryAllPermission,
		RouterRead:   RouterReadPermission,
		RouterAll:    RouterAllPermission,
		FlowRead:     FlowReadPermission,
		FlowAll:      FlowAllPermission,

		IndexAll:     IndexAllPermission,
		IndexRead:    IndexReadPermission,
		ViewsAll:     ViewsAllPermission,
		ViewsRead:    ViewsReadPermission,
		DiscoverRead: DiscoverReadPermission,
		DiscoverAll:  DiscoverAllPermission,

		RuleRead:    RuleReadPermission,
		RuleAll:     RuleAllPermission,
		AlertRead:   AlertReadPermission,
		AlertAll:    AlertAllPermission,
		ChannelRead: ChannelReadPermssion,
		ChannelAll:  ChannnelAllPermission,

		ClusterOverviewRead: ClusterOverviewReadPermission,
		ClusterOverviewAll:  ClusterOverviewAllPermission,
		ElasticsearchAll:    ElasticsearchAllPermission,
		ElasticsearchRead:   ElasticsearchReadPermission,
		ActivitiesAll:       ActivitiesAllPermission,
		ActivitiesRead:      ActivitiesReadPermission,
	}

}
