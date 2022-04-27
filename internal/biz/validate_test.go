package biz

import (
	"github.com/stretchr/testify/assert"
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
