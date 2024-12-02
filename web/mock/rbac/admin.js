// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

export default {
  //权限列表 type=console
  "GET /permisson/:type": (req, res) => {
    res.send({
      platform: [
        {
          id: "system",
          children: [
            {
              id: "system.cluster",
              // "privilege": {

              //     "read": "system.cluster:read",
              //     "all": "system.cluster:all"
              // }
              privilege: ["read", "all"],
            },
            {
              id: "system.role",
              privilege: ["read", "all"],
            },
            {
              id: "system.user",
              privilege: ["read", "all"],
            },
            {
              id: "system.command",
              privilege: ["read", "all"],
            },
          ],
        },
      ],
    });
  },
  //权限列表 type=elasticsearch
  "GET /permisson/:type": (req, res) => {
    res.send({
      cluster_privilege: {
        bulk: ["bulk"],
        cat: [
          "*",
          "cat.indices",
          "cat.help",
          "cat.repositories",
          "cat.pending_tasks",
          "cat.tasks",
          "cat.allocation",
          "cat.count",
          "cat.shards",
          "cat.aliases",
          "cat.nodeattrs",
          "cat.templates",
          "cat.thread_pool",
          "cat.health",
          "cat.recovery",
          "cat.fielddata",
          "cat.nodes",
          "cat.plugins",
          "cat.segments",
          "cat.snapshots",
          "cat.master",
        ],
      },

      index_privilege: [
        "indices.exists_alias",
        "indices.get_alias",
        "indices.recovery",
        "indices.delete",
        "indices.clear_cache",
        "indices.update_by_query",
        "indices.shrink",
        "indices.forcemerge",
        "indices.put_alias",
        "indices.create",
        "indices.split",
        "indices.flush",
        "indices.get_mapping",
        "indices.upgrade",
        "indices.validate_query",
        "indices.exists_template",
        "indices.get_upgrade",
        "indices.update_aliases",
        "indices.analyze",
        "indices.exists",
        "indices.close",
        "indices.delete_template",
        "indices.get_field_mapping",
        "indices.delete_alias",
        "indices.exists_type",
        "indices.get_template",
        "indices.put_template",
        "indices.refresh",
        "indices.segments",
        "indices.termvectors",
        "indices.flush_synced",
        "indices.put_mapping",
        "indices.get",
        "indices.get_settings",
        "indices.open",
        "indices.put_settings",
        "indices.stats",
        "indices.delete_by_query",
        "indices.rollover",
        "indices.shard_stores",
      ],
    });
  },
  //管理员创建角色
  "POST /role/:type": (req, res) => {
    req = {
      id: "1",
      name: "console-role", //名称唯一
      description: "description",
      platform: ["system.role:all", "system.user:all"],
    };

    res.send({
      _id: "3",
      result: "created",
    });
  },
  //管理员创建角色
  "POST /role/:type": (req, res) => {
    req = {
      name: "elasticsearch-role", //名称唯一
      description: "description",
      cluster: [
        { id: "1", name: "cluster1" },
        { id: "2", name: "cluster2" },
      ],
      cluster_privilege: [
        "cluster.reroute",
        "cluster.state",
        "nodes.hot_threads",
        "nodes.info",
      ],
      // "cluster_privilege": [
      //     {"cluster": [
      //         "cluster.reroute",
      //         "cluster.state"
      //     ]},
      //     {"node": [
      //         "node.hot_threads",
      //         "node.info"
      //     ]}
      // ],

      index: [
        {
          name: ["index1-*"],
          privilege: [
            "indices.exists_alias",
            "indices.get_alias",
            "indices.recovery",
            "indices.delete",
            "indices.clear_cache",
          ],
        },
        {
          name: ["index2"],
          privilege: [
            "indices.exists_alias",
            "indices.get_alias",
            "indices.recovery",
            "indices.delete",
            "indices.clear_cache",
          ],
        },
      ],
    };

    res.send({
      _id: "3",
      result: "created",
    });
  },
  //角色搜索
  //type 区分role  builtin是否内置
  //?keyword={keyword}&from={from}&siz={size}
  "GET /role/_search": (req, res) => {
    res.send({
      took: 0,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: 1,
        },
        max_score: 1,
        hits: [
          {
            _index: ".infini_user",
            _type: "_doc",
            _id: "c9chnates10k8i0tp9r0",
            _source: {
              builtin: false,
              created: "2022-04-15T16:54:49.9882088+08:00",
              description: "role1 描述",
              id: "c9cj5mdes10i2b0hjl70",
              name: "role1",
              platform: ["system.role:all", "system.user:all"],
              type: "console",
              updated: "2022-04-15T16:54:49.9882088+08:00",
            },
          },
        ],
      },
    });
  },
  //角色详情 type=console
  "GET /role/:id": (req, res) => {
    res.send({
      found: true,
      _id: "c9fm9jtes10h1odk90e0",
      _source: {
        id: "2",
        name: "console-role",
        buildin: false,
        created: "2022-01-01 12:12:12",
        type: "console",
        description: "description",
        platform: ["system.role:all", "system.user:all"],
      },
    });
  },
  //角色详情 type=elasticseaarch
  "GET /role/:id": (req, res) => {
    res.send({
      found: true,
      _id: "c9fm9jtes10h1odk90e0",
      _source: {
        id: "2",
        name: "elaticsearch-role",
        is_default: true,
        create_at: "2022-01-01 12:12:12",
        type: "elasticseaarch",
        description: "description",

        cluster: [
          { id: "1", name: "cluster1" },
          { id: "2", name: "cluster2" },
        ],
        cluster_privilege: [
          "cluster.reroute",
          "cluster.state",
          "nodes.hot_threads",
          "nodes.info",
        ],

        index: [
          {
            name: ["index1-*"],
            privilege: [
              "indices.exists_alias",
              "indices.get_alias",
              "indices.recovery",
              "indices.delete",
              "indices.clear_cache",
            ],
          },
          {
            name: ["index2"],
            privilege: [
              "indices.exists_alias",
              "indices.get_alias",
              "indices.recovery",
              "indices.delete",
              "indices.clear_cache",
            ],
          },
        ],
      },
    });
  },

  //修改角色
  "PUT /role/:id": (req, res) => {
    req = {
      name: "console-role", //名称唯一
      type: "console",
      description: "description",
      platform: ["system.role:all", "system.user:all"],
    };

    res.send({
      _id: "3",
      result: "updated",
    });
  },
  //修改角色
  "PUT /role/:id": (req, res) => {
    req = {
      id: "1",
      name: "elasticsearch-role", //名称唯一
      type: "elasticseaarch",
      description: "description",
      cluster: [
        { id: "1", name: "cluster1" },
        { id: "2", name: "cluster2" },
      ],
      cluster_privilege: [
        "cluster.reroute",
        "cluster.state",
        "nodes.hot_threads",
        "nodes.info",
      ],
      index: [
        {
          name: ["index1-*"],
          privilege: [
            "indices.exists_alias",
            "indices.get_alias",
            "indices.recovery",
            "indices.delete",
            "indices.clear_cache",
          ],
        },
        {
          name: ["index2"],
          privilege: [
            "indices.exists_alias",
            "indices.get_alias",
            "indices.recovery",
            "indices.delete",
            "indices.clear_cache",
          ],
        },
      ],
    };

    res.send({
      _id: "3",
      result: "updated",
    });
  },
  //删除角色
  "DELETE /role/:id": (req, res) => {
    res.send({
      _id: "3",
      result: "deleted",
    });
  },
  //管理员创建zhangsan用户
  "POST /user": (req, res) => {
    req = {
      username: "zhangsan",
      password: "123456",
      phone: "13012341234",
      email: "zhangsan@infini.ltd",
      name: "张三",
      //一起提交id和name 角色名不允许修改，用户名不允许修改
      roles: [
        {
          id: "1",
          name: "console-role",
        },
        {
          id: "2",
          name: "elaticsearch-role",
        },
      ],
    };

    res.send({
      _id: "1",
      result: "created",
      password: "zxcvbvb",
    });
  },
  //搜索用户
  //?keyword={keyword}&from={from}&siz={size}
  "GET /user/_search": (req, res) => {
    res.send({
      took: 0,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: 1,
        },
        max_score: 1,
        hits: [
          {
            _index: ".infini_user",
            _type: "_doc",
            _id: "c9chnates10k8i0tp9r0",
            _source: {
              id: "c9chnates10k8i0tp9r0",
              username: "zhangsan",
              password: "123456",
              phone: "13012341234",
              email: "zhangsan@infini.ltd",
              name: "张三",
              //一起提交id和name 角色名不允许修改，用户名不允许修改
              roles: [
                {
                  id: "1",
                  name: "console-role",
                },
                {
                  id: "2",
                  name: "elaticsearch-role",
                },
              ],
            },
          },
        ],
      },
    });
  },
  //修改用户
  "PUT /user/:id": (req, res) => {
    req = {
      username: "zhangsan", //用户名不允许修改
      password: "123456",
      phone: "13012341234",
      email: "zhangsan@infini.ltd",
      name: "大张三",
      roles: [
        {
          id: "1",
          name: "console-role",
        },
      ],
    };

    res.send({
      _id: "1",
      result: "updated",
    });
  },
  //删除用户
  "DELETE /user/:id": (req, res) => {
    res.send({
      _id: "1",
      result: "deleted",
    });
  },
  //查询用户
  "GET /user/:id": (req, res) => {
    res.send({
      _id: "c9fm9jtes10h1odk90e0",
      found: true,
      _source: {
        email: "zhangsan@infini.ltd",
        id: "c9fm9jtes10h1odk90e0",
        name: "王五",
        phone: "13800138000",
        roles: [
          {
            id: "1",
            name: "admin",
          },
        ],
        username: "wangwu1",
      },
    });
  },
  //如果创建用户时未分配角色，管理员给zhangsan用户分配角色
  "PUT /user/:id/role": (req, res) => {
    req = {
      roles: [
        {
          id: "1",
          name: "console-role",
        },
        {
          id: "2",
          name: "elaticsearch-role",
        },
      ],
    };

    res.send({
      result: "updated",
    });
  },

  //zhangsan用户名密码登录，返回所有后台权限列表
  //管理员登录验证permisson
  "POST /account/login": (req, res) => {
    req = {
      username: "admin",
      password: "123456",
    };

    res.send({
      status: "ok",
      id: "1001",

      access_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NTUyNzkyMzcsInVzZXJuYW1lIjoiYWRtaW4iLCJ1c2VyX2lkIjoiYWRtaW4iLCJyb2xlcyI6WyJBZG1pbmlzdHJhdG9yIl19.HxN0FuNQOPn6ayztfT0Xvi4bvz0Kv78Yntcd5Fctlg0",
      expire_in: 86400,
      id: "admin",
      privilege: [
        "system.security:all",
        "system.cluster:all",
        "system.command:all",
        "gateway.instance:all",
        "gateway.entry:all",
        "gateway.router:all",
        "gateway.flow:all",
        "data.index:all",
        "data.view:all",
        "data.discover:all",
        "alerting.rule:all",
        "alerting.alert:all",
        "alerting.channel:all",
        "alerting.message:all",
        "cluster.overview:all",
        "cluster.monitoring:all",
        "cluster.activities:all",
        "migration.replication:all",
      ],
      roles: ["Administrator"],
      status: "ok",
      username: "admin",
    });
  },
  //退出
  "DELETE /account/logout": (req, res) => {
    res.send({
      status: "ok",
    });
  },
  //修改密码
  "PUT /account/password": (req, res) => {
    req = {
      old_password: "123",
      new_password: "345",
    };
    res.send({
      status: "ok",
    });
  },
  //用户信息
  "GET /account/profile": (req, res) => {
    res.send({
      _id: "1",
      found: true,
      _source: {
        email: "zhangsan@infini.ltd",
        id: "c9fm9jtes10h1odk90e0",
        name: "admin",
        phone: "13800138000",
        username: "admin",
      },
    });
  },
  //用户信息
  "PUT /account/profile": (req, res) => {
    req = {
      email: "zhangsan@infini.ltd",
      name: "王五",
      phone: "13800138000",
    };
    res.send({
      result: "updated",
    });
  },
  "PUT /user/:id/password": (req, res) => {
    req = {
      password: "123456",
    };
    res.send({
      result: "updated",
    });
  },
};
