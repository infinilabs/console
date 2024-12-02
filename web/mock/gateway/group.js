const groupList = [
  {
    _index: ".infini_gateway_group",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk90",
    _source: {
      name: "default_group",
      owner: "infini",
      description: "华东区",
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
  {
    _index: ".infini_gateway_group",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk91",
    _source: {
      name: "上海",
      owner: "infini",
      description: "华东区",
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
  {
    _index: ".infini_gateway_group",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk92",
    _source: {
      name: "北京",
      owner: "infini",
      description: "华东区",
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
];

export default {
  "GET /gateway/group/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: groupList.length,
        },
        max_score: 1,
        hits: groupList,
      },
    });
  },
  "POST /gateway/group": function(req, res) {
    let newGroup = {
      _index: ".infini_gateway_group",
      _type: "_doc",
      _id: new Date().valueOf() + Math.random(),
      _source: {
        ...req.body,
        updated: new Date().toISOString(),
      },
    };
    groupList.push(newGroup);
    res.send({
      ...newGroup,
      result: "created",
    });
  },
  "PUT /gateway/group/:group_id": function(req, res) {
    res.send({
      _id: req.params.group_id,
      _source: {
        ...req.body,
        updated: new Date().toISOString(),
      },
      result: "updated",
    });
  },
  "DELETE /gateway/group/:group_id": function(req, res) {
    res.send({
      _id: req.params.group_id,
      result: "deleted",
    });
  },
  "GET /gateway/group/:group_id": function(req, res) {
    const group = groupList.find((en) => en._id == req.params.group_id);
    res.send(group);
  },
};
