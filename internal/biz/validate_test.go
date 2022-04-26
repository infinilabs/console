package biz

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func Test_validateIndex(t *testing.T) {
	type args struct {
		req      EsRequest
		userRole RolePermission
		route    string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{"no index permission",
			args{
				req: EsRequest{
					Method:  "GET",
					Cluster: []string{"cluster1"},
					Index:   []string{"index2"},
					Path:    "/index1/_mapping",
				},
				userRole: RolePermission{
					Cluster: []string{
						"cluster1",
					},
					Index: []string{
						"index1",
					},
					ClusterPrivilege: []string{
						"cat.*",
					},
					IndexPrivilege: []string{
						"indices.get_mapping",
					},
				},
				route: "indices.get_mapping",
			}, "no index permission",
		},
		{"no index api permission",
			args{
				req: EsRequest{
					Method:  "GET",
					Cluster: []string{"cluster1"},
					Index:   []string{"index1"},
					Path:    "/index1/_mapping",
				},
				userRole: RolePermission{
					Cluster: []string{
						"cluster1",
					},
					Index: []string{

						"index1",
					},
					ClusterPrivilege: []string{
						"cat.*",
					},
					IndexPrivilege: []string{
						"indices.delete",
					},
				},
				route: "indices.get_mapping",
			},
			"no index api permission",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			got := validateIndex(tt.args.req, tt.args.userRole, tt.args.route)

			assert.EqualError(t, got, tt.want)
		})
	}
}
func Test_validateCluster(t *testing.T) {
	type args struct {
		req      EsRequest
		userRole RolePermission
		route    string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{"no cluster permission",
			args{
				req: EsRequest{
					Method:  "GET",
					Cluster: []string{"cluster1"},
					Index:   []string{"index2"},
					Path:    "/index1/_mapping",
				},
				userRole: RolePermission{
					Cluster: []string{
						"cluster2",
					},
					Index: []string{
						"index1",
					},
					ClusterPrivilege: []string{
						"cat.*",
					},
					IndexPrivilege: []string{
						"indices.get_mapping",
					},
				},
				route: "indices.get_mapping",
			}, "no cluster permission",
		},
		{"no cluster api permission",
			args{
				req: EsRequest{
					Method:  "GET",
					Cluster: []string{"cluster1"},
					Index:   []string{"index1"},
					Path:    "/index1/_mapping",
				},
				userRole: RolePermission{
					Cluster: []string{
						"cluster1",
					},
					Index: []string{

						"index1",
					},
					ClusterPrivilege: []string{
						"cat.*",
					},
					IndexPrivilege: []string{
						"indices.delete",
					},
				},
				route: "indices.get_mapping",
			},
			"no cluster api permission",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			got := validateCluster(tt.args.req, tt.args.userRole, tt.args.route)

			assert.EqualError(t, got, tt.want)
		})
	}
}
