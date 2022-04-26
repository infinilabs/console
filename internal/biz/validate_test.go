package biz

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func Test_validateIndex(t *testing.T) {
	type args struct {
		req      IndexRequest
		userRole RolePermission
		route    string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		//{"no index permission",
		//	args{
		//		req: EsRequest{
		//			Method:  "GET",
		//			Cluster: []string{"cluster1"},
		//			Index:   []string{"index2"},
		//			Path:    "/index1/_mapping",
		//		},
		//		userRole: RolePermission{
		//			Cluster: []string{
		//				"cluster1",
		//			},
		//			Index: []string{
		//				"index1",
		//			},
		//			ClusterPrivilege: []string{
		//				"cat.*",
		//			},
		//			IndexPrivilege: []string{
		//				"indices.get_mapping",
		//			},
		//		},
		//		route: "indices.get_mapping",
		//	}, "no index permission",
		//},
		//{"no index api permission",
		//	args{
		//		req: EsRequest{
		//			Method:  "GET",
		//			Cluster: []string{"cluster1"},
		//			Index:   []string{"index1"},
		//			Path:    "/index1/_mapping",
		//		},
		//		userRole: RolePermission{
		//			Cluster: []string{
		//				"cluster1",
		//			},
		//			Index: []string{
		//
		//				"index1",
		//			},
		//			ClusterPrivilege: []string{
		//				"cat.*",
		//			},
		//			IndexPrivilege: []string{
		//				"indices.delete",
		//			},
		//		},
		//		route: "indices.get_mapping",
		//	},
		//	"no index api permission",
		//},
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
		{"no cluster permission",
			args{
				req: ClusterRequest{

					Cluster:   []string{"cluster1"},
					Privilege: []string{"indices.get_mapping"},
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
				},
			}, "no cluster permission",
		},
		{"no cluster api permission",
			args{
				req: ClusterRequest{

					Cluster:   []string{"cluster1"},
					Privilege: []string{"indices.get_mapping"},
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
