const destItem = {
  id: "c97auilath2e80qba16g",
  created: "2022-04-08T14:03:26.524693+08:00",
  updated: "2022-04-08T14:03:26.524693+08:00",
  name: "钉钉",
  type: "webhook",
  webhook: {
    header_params: { "Content-Type": "application/json" },
    method: "POST",
    url: "https://oapi.dingtalk.com/robot/send?access_token=XXXXXX",
    body: '{"msgtype": "text","text": {"content":"告警通知: $message"}}',
  },
};

export default {
  "POST /alerting/channel": function(req, res) {
    res.send({
      _id: "c97auilath2e80qba16g",
      _source: destItem,
      result: "created",
    });
  },
  "GET /alerting/channel/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 1, relation: "eq" },
        max_score: 1.0,
        hits: [
          {
            _index: ".infini_alerting-channel",
            _type: "_doc",
            _id: "c97auilath2e80qba16g",
            _score: 1.0,
            _source: destItem,
          },
        ],
      },
    });
  },
  "GET /alerting/channel/:id": function(req, res) {
    res.send({ 
      found: true, 
      _id: "c97auilath2e80qba16g", 
      _source: destItem,
    });
  },

  "PUT /alerting/channel/:id": function(req, res) {
    destItem.updated = new Date();
    res.send({
      _id: "c97auilath2e80qba16g",
      _source: destItem,
      result: "updated",
    });
  },
};
