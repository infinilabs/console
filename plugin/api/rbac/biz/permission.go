package biz

var ClusterApis = make([]string, 0)
var EsApis = make(map[string][]string)

type ConsolePermisson struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

func ListConsolePermisson() (list []ConsolePermisson, err error) {
	list = []ConsolePermisson{
		{
			Id:   "cluster_overview",
			Name: "平台概览",
		},
		{
			Id:   "cluster_search",
			Name: "平台搜索",
		},
		{
			Id:   "cluster_elasticsearch",
			Name: "集群监控",
		},
		{
			Id:   "cluster_elasticsearch_refresh",
			Name: "集群监控刷新",
		},
		{
			Id:   "cluster_activities",
			Name: "集群动态",
		},
		{
			Id:   "cluster_activities_search",
			Name: "集群动态搜索",
		},
	}
	return
}

type ElasticsearchPermisson struct {
	IndexPrivileges   []string `json:"index_privileges"`
	ClusterPrivileges []string `json:"cluster_privileges"`
}

func ListElasticsearchPermisson() (permisson ElasticsearchPermisson, err error) {

	permisson = ElasticsearchPermisson{
		ClusterPrivileges: ClusterApis,
		IndexPrivileges:   EsApis["indices"],
	}
	return
}
