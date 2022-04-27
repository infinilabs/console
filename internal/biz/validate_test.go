package biz

import (
	"github.com/stretchr/testify/assert"
	"infini.sh/framework/core/util"
	"testing"
)

func Test_validateIndex(t *testing.T) {
	type args struct {
		req      IndexRequest
		userRole RolePermission
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{"no index permission",
			args{
				req: IndexRequest{

					Cluster:   []string{"cluster1"},
					Index:     []string{"index2"},
					Privilege: []string{"indices.mapping"},
				},
				userRole: RolePermission{
					Cluster: []string{
						"cluster1",
					},

					ClusterPrivilege: []string{
						"cat.*",
					},
					IndexPrivilege: map[string][]string{
						"index1": []string{"indices.delete"},
					},
				},
			}, "no index permission",
		},
		{"no index api permission",
			args{
				req: IndexRequest{

					Cluster:   []string{"cluster1"},
					Index:     []string{"index1"},
					Privilege: []string{"indices.mapping"},
				},
				userRole: RolePermission{
					Cluster: []string{
						"cluster1",
					},

					ClusterPrivilege: []string{
						"cat.*",
					},
					IndexPrivilege: map[string][]string{
						"index1": []string{"indices.delete"},
					},
				},
			},
			"no index api permission",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			got := ValidateIndex(tt.args.req, tt.args.userRole)

			assert.EqualError(t, got, tt.want)
		})
	}
}
func Test_validateCluster(t *testing.T) {
	type args struct {
		req      ClusterRequest
		userRole RolePermission
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{"no cluster",
			args{
				req: ClusterRequest{

					Cluster:   []string{"cluster1"},
					Privilege: []string{"indices.get_mapping"},
				},
				userRole: RolePermission{
					Cluster: []string{
						"cluster2",
					},

					ClusterPrivilege: []string{
						"cat.*",
					},
				},
			}, "no cluster permission",
		},
		{"no cluster",
			args{
				req: ClusterRequest{
					Cluster:   []string{"cluster1"},
					Privilege: []string{"indices.get_mapping"},
				},
				userRole: RolePermission{
					Cluster:          []string{},
					ClusterPrivilege: []string{},
				},
			}, "no cluster permission",
		},
		{"no cluster api",
			args{
				req: ClusterRequest{

					Cluster:   []string{"cluster1"},
					Privilege: []string{"indices.get_mapping"},
				},
				userRole: RolePermission{
					Cluster: []string{
						"cluster1",
					},

					ClusterPrivilege: []string{
						"cat.*",
					},
				},
			},
			"no cluster api permission",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidateCluster(tt.args.req, tt.args.userRole)
			assert.EqualError(t, got, tt.want)
		})
	}
}
func TestStringInArray(t *testing.T) {
	array := []string{"a", "b", "c", "d", "e"}
	assert.Equal(t, true, util.StringInArray(array, "c"))
	assert.Equal(t, false, util.StringInArray(array, "h"))
}
func TestFilterCluster(t *testing.T) {
	RoleMap["test"] = Role{
		Cluster: []struct {
			Id   string `json:"id"`
			Name string `json:"name"`
		}{
			{
				Id:   "c97rd2les10hml00pgh0",
				Name: "docker-cluster",
			},
		},
		ClusterPrivilege: []string{"cat.*"},
		Index: []struct {
			Name      []string `json:"name"`
			Privilege []string `json:"privilege"`
		}{
			{
				Name:      []string{".infini_rbac-role"},
				Privilege: []string{"indices.get_mapping"},
			},
			{
				Name:      []string{".infini_rbac-user", ".infini_rbac-role"},
				Privilege: []string{"cat.*"},
			},
		},
	}
	type args struct {
		roles   []string
		cluster []string
	}
	tests := []struct {
		name string
		args args
		want []string
	}{
		{
			name: "empty",
			args: args{
				roles: []string{"test"},
				cluster: []string{
					"cluser1", "cluster2",
				},
			},
			want: []string{},
		},
		{
			name: "one",
			args: args{
				roles: []string{"test"},
				cluster: []string{
					"cluser1", "cluster2", "c97rd2les10hml00pgh0",
				},
			},
			want: []string{"c97rd2les10hml00pgh0"},
		},
		{
			name: "only",
			args: args{
				roles: []string{"test"},
				cluster: []string{
					"c97rd2les10hml00pgh0",
				},
			},
			want: []string{"c97rd2les10hml00pgh0"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := FilterCluster(tt.args.roles, tt.args.cluster)
			assert.Equal(t, got, tt.want)
		})
	}

}
func TestFilterIndex(t *testing.T) {
	RoleMap["test"] = Role{
		Cluster: []struct {
			Id   string `json:"id"`
			Name string `json:"name"`
		}{
			{
				Id:   "c97rd2les10hml00pgh0",
				Name: "docker-cluster",
			},
		},
		ClusterPrivilege: []string{"cat.*"},
		Index: []struct {
			Name      []string `json:"name"`
			Privilege []string `json:"privilege"`
		}{
			{
				Name:      []string{".infini_rbac-role"},
				Privilege: []string{"indices.get_mapping"},
			},
			{
				Name:      []string{".infini_rbac-user", ".infini_rbac-role"},
				Privilege: []string{"cat.*"},
			},
		},
	}

	type args struct {
		roles []string
		index []string
	}
	tests := []struct {
		name string
		args args
		want []string
	}{
		{
			name: "empty",
			args: args{
				roles: []string{"test"},
				index: []string{
					"index1", "index2",
				},
			},
			want: []string{},
		},
		{
			name: "one",
			args: args{
				roles: []string{"test"},
				index: []string{
					"index1", "index2", ".infini_rbac-user",
				},
			},
			want: []string{".infini_rbac-user"},
		},
		{
			name: "only",
			args: args{
				roles: []string{"test"},
				index: []string{
					".infini_rbac-user",
				},
			},
			want: []string{".infini_rbac-user"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := FilterIndex(tt.args.roles, tt.args.index)
			assert.Equal(t, got, tt.want)
		})
	}

}
