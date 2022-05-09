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
	ViewsAll     = "data.view:all"
	ViewsRead    = "data.view:read"
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
	MonitoringRead   = "cluster.monitoring:read"
	MonitoringAll    = "cluster.monitoring:all"
	ActivitiesRead      = "cluster.activities:read"
	ActivitiesAll       = "cluster.activities:all"
)

const (
	PermissionUserRead string = "user:read"
	PermissionUserWrite = "user:write"
	PermissionRoleRead = "role:read"
	PermissionRoleWrite = "role:write"
	PermissionCommandRead = "command:read"
	PermissionCommandWrite = "command:write"
	PermissionElasticsearchClusterRead = "es.cluster:read"
	PermissionElasticsearchClusterWrite = "es.cluster:write" // es cluster
	PermissionElasticsearchIndexRead = "es.index:read"
	PermissionElasticsearchIndexWrite = "es.index:write" // es index metadata
	PermissionElasticsearchNodeRead = "es.node:read" //es node metadata
	PermissionActivityRead = "activity:read"
	PermissionActivityWrite = "activity:write"
	PermissionAlertRuleRead = "alert.rule:read"
	PermissionAlertRuleWrite = "alert.rule:write"
	PermissionAlertHistoryRead = "alert.history:read"
	PermissionAlertHistoryWrite = "alert.history:write"
	PermissionAlertChannelRead = "alert.channel:read"
	PermissionAlertChannelWrite = "alert.channel:write"
	PermissionViewRead = "view:read"
	PermissionViewWrite = "view:write"
	PermissionGatewayInstanceRead = "gateway.instance:read"
	PermissionGatewayInstanceWrite = "gateway.instance:write"
	PermissionGatewayEntryRead = "gateway.entry:read"
	PermissionGatewayEntryWrite = "gateway.entry:write"
	PermissionGatewayRouterRead = "gateway.router:read"
	PermissionGatewayRouterWrite = "gateway.router:write"
	PermissionGatewayFlowRead = "gateway.flow:read"
	PermissionGatewayFlowWrite = "gateway.flow:write"
	PermissionElasticsearchMetricRead = "es.metric:read"
)

var (
	UserReadPermission = []string{PermissionUserRead}
	UserAllPermission  = []string{PermissionUserRead, PermissionUserWrite,PermissionRoleRead}

	RoleReadPermission = []string{PermissionRoleRead}
	RoleAllPermission  = []string{PermissionRoleRead, PermissionRoleWrite}

	ClusterReadPermission = []string{PermissionElasticsearchClusterRead}
	ClusterAllPermission  = []string{PermissionElasticsearchClusterRead, PermissionElasticsearchClusterWrite}

	CommandReadPermission = []string{PermissionCommandRead}
	CommandAllPermission  = []string{PermissionCommandRead, PermissionCommandWrite}

	InstanceReadPermission = []string{PermissionGatewayInstanceRead}
	InstanceAllPermission  = []string{PermissionGatewayInstanceRead,PermissionGatewayInstanceWrite}

	EntryReadPermission = []string{PermissionGatewayEntryRead}
	EntryAllPermission  = []string{PermissionGatewayEntryRead, PermissionGatewayEntryWrite}

	RouterReadPermission = []string{PermissionGatewayRouterRead}
	RouterAllPermission  = []string{PermissionGatewayRouterRead, PermissionGatewayRouterWrite}

	FlowReadPermission = []string{PermissionGatewayFlowRead}
	FlowAllPermission  = []string{PermissionGatewayFlowRead, PermissionGatewayFlowWrite}

	IndexAllPermission     = []string{"index:read"}
	IndexReadPermission    = []string{"index:read", "index:write"}
	ViewsAllPermission     = []string{PermissionViewRead}
	ViewsReadPermission    = []string{PermissionViewRead, PermissionViewWrite}
	DiscoverReadPermission = []string{PermissionViewRead}
	DiscoverAllPermission  = []string{PermissionViewRead}

	RuleReadPermission    = []string{PermissionAlertRuleRead}
	RuleAllPermission     = []string{PermissionAlertRuleRead, PermissionAlertRuleWrite}
	AlertReadPermission   = []string{PermissionAlertHistoryRead}
	AlertAllPermission    = []string{PermissionAlertHistoryRead, PermissionAlertHistoryWrite}
	ChannelReadPermission = []string{PermissionAlertChannelRead}
	ChannelAllPermission  = []string{PermissionAlertChannelRead, PermissionAlertChannelWrite}

	ClusterOverviewReadPermission = []string{PermissionElasticsearchClusterRead, PermissionElasticsearchIndexRead, PermissionElasticsearchNodeRead, PermissionElasticsearchMetricRead}
	ClusterOverviewAllPermission  = ClusterOverviewReadPermission
	MonitoringReadPermission = ClusterOverviewAllPermission

	ActivitiesReadPermission = []string{PermissionActivityRead}
	ActivitiesAllPermission  = []string{PermissionActivityRead, PermissionActivityWrite}
)

var AdminPrivilege = []string{
	UserAll, RoleAll, ClusterAll, CommandAll,
	InstanceAll, EntryAll, RouterAll, FlowAll,
	IndexAll, ViewsAll, DiscoverAll,
	RuleAll, AlertAll, ChannelAll,
	ClusterOverviewAll, MonitoringAll, ActivitiesAll,
}

var BuildRoles = make(map[string]map[string]interface{}, 0)

func init() {

	BuildRoles["admin"] = map[string]interface{}{
		"id":          "admin",
		"name":        "管理员",
		"type":        "platform",
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
		ChannelRead: ChannelReadPermission,
		ChannelAll:  ChannelAllPermission,

		ClusterOverviewRead: ClusterOverviewReadPermission,
		ClusterOverviewAll:  ClusterOverviewAllPermission,
		MonitoringAll:    MonitoringReadPermission,
		MonitoringRead:   MonitoringReadPermission,
		ActivitiesAll:       ActivitiesAllPermission,
		ActivitiesRead:      ActivitiesReadPermission,
	}

}
