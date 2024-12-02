const entryList = [
  {
    _index: ".infini_gateway_entry",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk70",
    _source: {
      name: "my_es_entry",
      enabled: true,
      router: "c0oc4kkgq9s8qss2uk60",
      max_concurrency: 10,
      read_timeout: 100,
      write_timeout: 200,
      idle_timeout: 300,
      read_buffer_size: 1024 * 1024,
      write_buffer_size: 1024 * 1024,
      tcp_keepalive: true,
      tcp_keepalive_in_seconds: 1,
      max_request_body_size: 1024 * 1024,
      reduce_memory_usage: false,
      network: {
        binding: "127.0.0.1:9000",
        host: "127.0.0.1",
        port: 9000,
        publish: "127.0.0.1:9000",
        skip_occupied_port: true,
        reuse_port: true
      },
      tls: {
        enabled: false,
      },
      updated: "2022-01-18T16:03:30.867084+08:00",
    }
  },
];

// Create entry
// curl -XPOST http://localhost:2900/gateway/entry -d'{ "name": "my_es_entry", "enabled": true, "router": "c0oc4kkgq9s8qss2uk60", "max_concurrency": 10, "read_timeout": 100, "write_timeout": 200, "idle_timeout": 300, "read_buffer_size": 1048576, "write_buffer_size": 1048576, "tcp_keepalive": true, "tcp_keepalive_in_seconds": 1, "max_request_body_size": 1048576, "reduce_memory_usage": false, "network": { "binding": "127.0.0.1:9000", "host": "127.0.0.1", "port": 9000, "publish": "127.0.0.1:9000", "skip_occupied_port": true, "reuse_port": true }, "tls": { "enabled": false }, "updated": "2022-01-18T16:03:30.867084+08:00" }'

//Get entry
//curl -XGET http://localhost:2900/gateway/entry/c7lsqd4gq9s5n1pi9ev0

//update entry
// curl -XPUT http://localhost:2900/gateway/entry/c7lsqd4gq9s5n1pi9ev0 -d'{ "name": "my_es_entry1", "enabled": true, "router": "c0oc4kkgq9s8qss2uk60", "max_concurrency": 10, "read_timeout": 100, "write_timeout": 200, "idle_timeout": 300, "read_buffer_size": 1048576, "write_buffer_size": 1048576, "tcp_keepalive": true, "tcp_keepalive_in_seconds": 1, "max_request_body_size": 1048576, "reduce_memory_usage": false, "network": { "binding": "127.0.0.1:9000", "host": "127.0.0.1", "port": 9000, "publish": "127.0.0.1:9000", "skip_occupied_port": true, "reuse_port": true }, "tls": { "enabled": false }, "updated": "2022-01-18T16:03:30.867084+08:00" }'


export default {
  "GET /gateway/entry/_search": function(req, res) {
    res.send({
      took: 0,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: entryList.length,
        },
        max_score: 1,
        hits: entryList,
      },
      routers: {
        c0oc4kkgq9s8qss2uk60: "my_router",
        c0oc4kkgq9s8qss2uk61: "test_router",
      },
    });
  },
  "POST /gateway/entry": function(req, res) {
    let newEntry = {
      _index: ".infini_gateway_entry",
      _type: "_doc",
      _id: new Date().valueOf() + Math.random(),
      _source: {
        ...req.body,
        updated: new Date().toISOString(),
      },
    };
    entryList.push(newEntry);
    res.send({
      ...newEntry,
      result: "created",
    });
  },
  "PUT /gateway/entry/:entry_id": function(req, res) {
    res.send({
      _id: req.params.entry_id,
      _source: {
        ...req.body,
        updated: new Date().toISOString(),
      },
      result: "updated",
    });
  },
  "DELETE /gateway/entry/:entry_id": function(req, res) {
    res.send({
      _id: req.params.entry_id,
      result: "deleted",
    });
  },
  "GET /gateway/entry/:entry_id": function(req, res) {
    const entry = entryList.find((en) => en._id == req.params.entry_id);
    res.send(entry);
  },
};
