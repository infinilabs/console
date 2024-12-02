const routerList = [
  {
    _index: ".infini_gateway_router",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk60",
    _source: {
      name: "my_router",
      default_flow: "c0oc4kkgq9s8qss2uk50",
      tracing_flow: "c0oc4kkgq9s8qss2uk51",
      rules: [
        {
          method: ["PUT", "POST"],
          pattern: ["/_bulk"],
          flow: ["c0oc4kkgq9s8qss2uk50"],
          description: "test router rule",
        },
      ],
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
  {
    _index: ".infini_gateway_router",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk61",
    _source: {
      name: "test_router",
      default_flow: "c0oc4kkgq9s8qss2uk51",
      tracing_flow: "c0oc4kkgq9s8qss2uk50",
      rules: [
        {
          method: ["PUT", "POST"],
          pattern: ["/_bulk"],
          flow: ["c0oc4kkgq9s8qss2uk50"],
          description: "test router rule",
        },
      ],
      updated: "2022-01-18T16:03:32.867084+08:00",
    },
  },
];

export default {
  "GET /gateway/router/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: routerList.length,
        },
        max_score: 1,
        hits: routerList,
      },
      flows: {
        c0oc4kkgq9s8qss2uk50: "default_flow",
        c0oc4kkgq9s8qss2uk51: "logging",
      },
    });
  },
  "POST /gateway/router": function(req, res) {
    let newRouter = {
      _index: ".infini_gateway_router",
      _type: "_doc",
      _id: new Date().valueOf() + Math.random(),
      _source: {
        ...req.body,
        updated: new Date().toISOString(),
      },
    };
    routerList.push(newRouter);
    res.send({
      ...newRouter,
      result: "created",
    });
  },
  "PUT /gateway/router/:router_id": function(req, res) {
    res.send({
      _id: req.params.router_id,
      _source: req.body,
      result: "updated",
    });
  },
  "DELETE /gateway/router/:router_id": function(req, res) {
    res.send({
      _id: req.params.router_id,
      result: "deleted",
    });
  },
  "GET /gateway/router/:router_id": function(req, res) {
    const router = routerList.find((r) => r._id == req.params.router_id);
    res.send(router);
  },
};
