export default {
  'GET /elasticsearch/:id/alias': function (req, res) {
    res.send({
      ".kibana": {
        "alias": ".kibana",
        "index": [
          ".kibana_1"
        ]
      },
      ".kibana-event-log-7.10.0": {
        "alias": ".kibana-event-log-7.10.0",
        "index": [
          ".kibana-event-log-7.10.0-000003",
          ".kibana-event-log-7.10.0-000005",
          ".kibana-event-log-7.10.0-000004",
          ".kibana-event-log-7.10.0-000002"
        ],
        "write_index": ".kibana-event-log-7.10.0-000005"
      },
      ".kibana_task_manager": {
        "alias": ".kibana_task_manager",
        "index": [
          ".kibana_task_manager_1"
        ]
      },
      "custom": {
        "alias": "custom",
        "index": [
          "test-custom"
        ]
      },
      "ilm-history-3": {
        "alias": "ilm-history-3",
        "index": [
          "ilm-history-3-000004",
          "ilm-history-3-000005",
          "ilm-history-3-000003",
          "ilm-history-3-000002"
        ],
        "write_index": "ilm-history-3-000005"
      },
      "metricbeat-7.10.0": {
        "alias": "metricbeat-7.10.0",
        "index": [
          "metricbeat-7.10.0-2021.04.07-000003",
          "metricbeat-7.10.0-2021.02.03-000001",
          "metricbeat-7.10.0-2021.03.06-000002"
        ],
        "write_index": "metricbeat-7.10.0-2021.04.07-000003"
      }
    })
  },
  'POST /elasticsearch/:id/alias': function (req, res) {
    res.send({
      "acknowledged": true
    })
  }
}