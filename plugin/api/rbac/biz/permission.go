package biz

var CategoryApi = make(map[string][]string)

type ConsolePermisson struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

func ListConsolePermisson() (list []ConsolePermisson, err error) {
	list = []ConsolePermisson{
		{
			Id:   "1",
			Name: "数据管理",
		},
		{
			Id:   "2",
			Name: "网关管理",
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
		ClusterPrivileges: CategoryApi["list"],
	}
	return
}
