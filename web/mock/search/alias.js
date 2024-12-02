export default {
  'GET /elasticsearch/:id/alias': function (req, res) {
    res.send({
      ".kibana": {
        "alias": ".kibana",
        "indexes": [
          {
            "index": ".kibana_1",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": false,
            "is_write_index": false
          }
        ]
      },
      ".kibana-event-log-7.10.0": {
        "alias": ".kibana-event-log-7.10.0",
        "indexes": [
          {
            "index": ".kibana-event-log-7.10.0-000006",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": false,
            "is_write_index": true
          },
          {
            "index": ".kibana-event-log-7.10.0-000004",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": false,
            "is_write_index": false
          },
          {
            "index": ".kibana-event-log-7.10.0-000003",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": false,
            "is_write_index": false
          },
          {
            "index": ".kibana-event-log-7.10.0-000005",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": false,
            "is_write_index": false
          }
        ],
        "write_index": ".kibana-event-log-7.10.0-000006"
      },
      ".kibana_task_manager": {
        "alias": ".kibana_task_manager",
        "indexes": [
          {
            "index": ".kibana_task_manager_1",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": false,
            "is_write_index": false
          }
        ]
      },
      "custom": {
        "alias": "custom",
        "indexes": [
          {
            "index": "test-custom",
            "filter": {
              "match": {
                "name": "test"
              }
            },
            "index_routing": "1",
            "search_routing": "1",
            "is_hidden": false,
            "is_write_index": false
          },
          {
            "index": "test-custom8",
            "filter": {
              "match": {
                "name": "test"
              }
            },
            "index_routing": "1",
            "search_routing": "1",
            "is_hidden": false,
            "is_write_index": false
          }
        ]
      },
      "ilm-history-3": {
        "alias": "ilm-history-3",
        "indexes": [
          {
            "index": "ilm-history-3-000004",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": true,
            "is_write_index": false
          },
          {
            "index": "ilm-history-3-000006",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": true,
            "is_write_index": true
          },
          {
            "index": "ilm-history-3-000003",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": true,
            "is_write_index": false
          },
          {
            "index": "ilm-history-3-000005",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": true,
            "is_write_index": false
          }
        ],
        "write_index": "ilm-history-3-000006"
      },
      "metricbeat-7.10.0": {
        "alias": "metricbeat-7.10.0",
        "indexes": [
          {
            "index": "metricbeat-7.10.0-2021.04.07-000003",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": false,
            "is_write_index": true
          },
          {
            "index": "metricbeat-7.10.0-2021.02.03-000001",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": false,
            "is_write_index": false
          },
          {
            "index": "metricbeat-7.10.0-2021.03.06-000002",
            "filter": null,
            "index_routing": "",
            "search_routing": "",
            "is_hidden": false,
            "is_write_index": false
          }
        ],
        "write_index": "metricbeat-7.10.0-2021.04.07-000003"
      }
    })
  },
  'POST /elasticsearch/:id/alias': function (req, res) {
    //curl add example
    // curl -X POST -d '{ "actions" : [{ "add": { "index" : "test-custom", "alias" : "custom" } }]}'
    //curl delete example
    // curl -X POST -d '{ "actions" : [{ "remove": { "index" : "test-custom", "alias" : "custom" } }]}'

    res.send({
      "acknowledged": true
    })
  }
}