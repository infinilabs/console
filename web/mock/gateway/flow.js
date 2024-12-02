const flows = [
  {
    _index: ".infini_gateway_flow",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk50",
    _source: {
      name: "default_flow",
      filter: [
        {
          request_body_json_del: {
            path: ["query.bool.should.[0]", "query.bool.must"],
            ignore_missing: false,
            when: {
              has_fields: ["gg", "ee"],
            },
          },
        },
      ],
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
  {
    _index: ".infini_gateway_flow",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk51",
    _source: {
      name: "logging",
      filter: [
        {
          request_body_json_set: {
            path: ["aa -> bb"],
            when: {
              range: {
                "_ctx.request.body_length.gte": 100,
                "_ctx.request.body_length.lt": 5000,
              },
            },
          },
        },
      ],
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
  {
    _index: ".infini_gateway_flow",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk52",
    _source: {
      name: "test_when_range",
      filter: [
        {
          request_body_json_set: {
            path: ["aa -> bb"],
            when: {
              range: { "_ctx.response.code": { gte: 400 } },
            },
          },
        },
      ],
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
];

export default {
  "GET /gateway/filter/metadata": function(req, res) {
    res.send({
      request_body_json_del: {
        properties: {
          path: {
            type: "array",
            sub_type: "string",
          },
        },
      },
      request_body_json_set: {
        properties: {
          path: {
            type: "array",
            sub_type: "keyvalue",
          },
        },
      },
      ldap_auth: {
        properties: {
          host: {
            type: "string",
            default_value: "ldap.forumsys.com",
          },
          port: {
            type: "number",
            default_value: 389,
          },
          bind_dn: {
            type: "string",
          },
          bind_password: {
            type: "string",
          },
          base_dn: {
            type: "string",
          },
          user_filter: {
            type: "string",
          },
        },
      },
    });
  },
  "GET /gateway/flow/_search": function(req, res) {
    const from = req.query.from || 0;
    const size = req.query.size || 20;
    res.send({
      took: 0,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: flows.length,
        },
        max_score: 1,
        hits: flows.slice(from, from + size),
      },
    });
  },
  "GET /gateway/flow/:flow_id": function(req, res) {
    const flow = flows.find((en) => en._id == req.params.flow_id);
    res.send(flow);
  },
  "POST /gateway/flow": function(req, res) {
    let newFlow = {
      _index: ".infini_gateway_flow",
      _type: "_doc",
      _id: new Date().valueOf() + Math.random(),
      _source: {
        ...req.body,
        updated: new Date().toISOString(),
      },
    };
    flows.push(newFlow);
    res.send({
      ...newFlow,
      result: "created",
    });
  },
  "PUT /gateway/flow/:flow_id": function(req, res) {
    res.send({
      _id: req.params.flow_id,
      _source: req.body,
      result: "updated",
    });
  },
  "DELETE /gateway/flow/:flow_id": function(req, res) {
    res.send({
      _id: req.params.flow_id,
      result: "deleted",
    });
  },
};
