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
  "POST /elasticsearch/try_connect ": function(req, res) {
    // res.status(500).json({
    //     "active_shards": 26,
    //     "cluster_name": "es-v7102",
    //     "cluster_uuid": "drAvXG5dSiKbAZ8CRsMDpw",
    //     "number_of_data_nodes": 1,
    //     "number_of_nodes": 1,
    //     "status": "green",
    // });
    res.send({
      active_shards: 26,
      cluster_name: "es-v7102",
      cluster_uuid: "drAvXG5dSiKbAZ8CRsMDpw",
      number_of_data_nodes: 1,
      number_of_nodes: 1,
      status: "green",
      version: "7.3",
    });
  },

  "POST /setup/_validate": function(req, res) {
    res.send({
      success: true,
    });

    // error
    // res.status(500).send({
    //     "success": false,
    //     "error":{
    //         "reason":"there are following indices exists in target elasticsearch: \n.infini_view\n.infini_alert-history\n.infini_router\n.infini_flow\n.infini_agent\n.infini_index\n.infini_dashboard\n.infini_metrics-000003\n.infini_metrics\n.infini_gateway-instance\n.infini_node\n.infini_task\n.infini_alert-message\n.infini_visualization\n.infini_entry\n.infini_alert-rule\n.infini_host\n.infini_cluster\n.infini_commands\n.infini_activities\n.infini_channel\n"
    //     },
    //     "fix_tips": "DELETE .infini_*\nDELETE .infini_*\n",
    //     "type": "elasticsearch_indices_exists"
    // })
  },

  "POST /setup/_initialize": function(req, res) {
    res.send({
      success: true,
    });

    // error
    // res.status(500).json({
    //     "success": false,
    //     "error":{
    //         "reason":"集群初始化错误，具体错误原因为：xxx"
    //     }
    // });
  },

  "GET /health": function(req, res) {
    res.send({
      setup_required: false,
      status: "green",
      services: {
        backend_storage: "green",
        message_queue: "green",
        key_value_store: "green",
        task_service: "green",
      },
    });
  },
};
