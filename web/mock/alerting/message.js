export default {
  //filter min, max severity, status
  "GET /alerting/message/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 2, relation: "eq" },
        max_score: null,
        hits: [
          {
            _index: ".infini_alert-message",
            _type: "_doc",
            _id: "ca12445ath21ailjveb0",
            _score: null,
            _source: {
              id: "ca12445ath21ailjveb0",
              created: "2022-05-16T18:06:08.87159+08:00",
              updated: "2022-05-16T18:22:29.684629+08:00",
              rule_id: "c9tm3tlath24js45edq0",
              title: "",
              content: "",
              status: "recovered",
              ignored_time: "0001-01-01T00:00:00Z",
              severity: "critical",
            },
            sort: [1652695568871],
          },
          {
            _index: ".infini_alert-message",
            _type: "_doc",
            _id: "ca11ftlath203rckuef0",
            _score: null,
            _source: {
              id: "ca11ftlath203rckuef0",
              created: "2022-05-16T17:23:02.406569+08:00",
              updated: "2022-05-16T18:05:39.012014+08:00",
              rule_id: "c9tm3tlath24js45edq0",
              title: "",
              content: "",
              status: "recovered",
              ignored_time: "0001-01-01T00:00:00Z",
              severity: "critical",
            },
            sort: [1652692982406],
          },
        ],
      },
    });
  },
  "GET /alerting/message/_stats": function(req, res) {
    res.send({
      alert: {
        current: {
          critical: 3, //严重告警数量
          error: 0, //重要告警数量
          warning: 10, //提示告警数量
        },
      },
    });
  },
  //request body=>{"messages":[{id:"ca25dklath2742nqa9eg", "rule_id": "aa25dklath2742nqa9eg"}]}
  "POST /alerting/message/_ignore": function(req, res) {
    //change message status to ignored
    res.send({
      ids: ["ca25dklath2742nqa9eg"],
      result: "updated",
    });
  },
  "GET /alerting/message/:message_id": function(req, res) {
    res.send({
      message_id: "ca3fe31pdamugi9jnlm0",
      rule_id: "c9tntk1pdamsm9kdb2dg",
      conditions: {
        operator: "any",
        items: [
          {
            minimum_period_match: 1,
            operator: "lte",
            values: ["76"],
            severity: "error",
            expression:
              "min(payload.elasticsearch.node_stats.fs.total.free_in_bytes)/max(payload.elasticsearch.node_stats.fs.total.total_in_bytes)*100 <= 76",
          },
          {
            minimum_period_match: 1,
            operator: "lte",
            values: ["75"],
            severity: "critical",
            expression:
              "min(payload.elasticsearch.node_stats.fs.total.free_in_bytes)/max(payload.elasticsearch.node_stats.fs.total.total_in_bytes)*100 <= 75",
          },
        ],
      },
      created: "2022-05-19T09:21:00.553909+08:00",
      duration: 6281185,
      ignored_time: "0001-01-01T00:00:00Z",
      message: "资源集群: elasticsearch\n事件ID: ca2r80dath24481o3mt0",
      resource_name: "elasticsearch",
      resource_objects: [".infini_metrics"],
      severity: "critical",
      status: "alerting",
      title: " c8i18llath2blrusdjng 磁盘剩余空间小于75%",
      updated: "2022-05-19T11:05:37.345208+08:00",
    });
  },
};
