const sourceItem = {
  id: "c97um9tath2fgbc3jbsg",
  created: "2022-06-14T10:58:31.318579+08:00",
  updated: "2022-06-14T10:58:31.318579+08:00",
  enabled: true,
  name: "复制任务1",
  source_cluster_id: "c97um9tath2fgbc3jbs1",
  source_cluster_name: "Cluster-A",
  target_cluster_id: "c97um9tath2fgbc3jbs2",
  target_cluster_name: "Cluster-B",
};

export default {
  "POST /migration/replication": function(req, res) {
    res.send({
      _id: "c97um9tath2fgbc3jbsg",
      _source: sourceItem,
      result: "created",
    });
  },
  "GET /migration/replication/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 1, relation: "eq" },
        max_score: 1.0,
        hits: [
          {
            _index: ".infini_migration-replication",
            _type: "_doc",
            _id: "c97um9tath2fgbc3jbsg",
            _score: 1.0,
            _source: {
              ...sourceItem,
            },
          },
        ],
      },
    });
  },
  "GET /migration/replication/:id": function(req, res) {
    res.send({
      found: true,
      _id: "c97um9tath2fgbc3jbsg",
      _source: sourceItem,
    });
  },

  "PUT /migration/replication/:id": function(req, res) {
    sourceItem.updated = new Date();
    res.send({
      _id: "c97um9tath2fgbc3jbsg",
      _source: replication,
      result: "updated",
    });
  },
  "DELETE /migration/replication/:id": function(req, res) {
    //移除对应任务
    res.send({
      result: "deleted",
    });
  },
  //{"enabled": false}
  "POST /migration/replication/:id/_enable": function(req, res) {
    //关闭开启任务
    res.send({
      result: "updated",
    });
  },
};
