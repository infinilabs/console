const gatewayList = [
  {
    _index: ".infini_gateway_instance",
    _type: "_doc",
    _id: "c0oc4kkgq9s8qss2uk80",
    _source: {
      name: "my_gateway_instance",
      endpoint: "http://localhost:9200",
      version: {
        build_date: "2023-12-31 10:10:10",
        build_hash: "8a147f8",
        eol_date: "2022-02-13 13:58:24",
        number: "1.0.0_SNAPSHOT",
      },
      entrys: ["c0oc4kkgq9s8qss2uk70"], //单独索引存储关系, 查询时拼接
      group: "c0oc4kkgq9s8qss2uk90", //单独索引存储关系，查询时拼接
      owner: "infini",
      basic_auth: {
        username: "hello",
        password: "test",
      },
      description: "广告业务 elasticsearch 极限网关",
      updated: "2022-01-18T16:03:30.867084+08:00",
    },
  },
];

const agentList = [
  {
    _index: ".infini_agent",
    _type: "_doc",
    _id: "ciclt5t3q95kignnkgkg",
    _score: 1.0,
    _source: {
      id: "ciclt5t3q95kignnkgkg",
      created: "2023-08-02T19:43:40.087557313+08:00",
      updated: "2023-09-28T21:17:16.299903927+08:00",
      name: "ShootingStar",
      endpoint: "https://10.0.0.3:8080",
      version: {
        build_date: "2023-08-02T11:11:30Z",
        build_hash: "dee228e870de39894bd5e88a11a549393dfcafd6",
        build_number: "99",
        eol_date: "2023-12-31T10:10:10Z",
        number: "0.7.0_NIGHTLY",
      },
      basic_auth: {},
      tags: ["default"],
      ips: ["192.168.3.185", "10.0.0.3", "172.17.0.1"],
      major_ip: "192.168.3.185",
      status: "offline",
      host: {
        name: "dell",
        os: { name: "ubuntu", arch: "x86_64", version: "4.15.0-213-generic" },
      },
    },
  },
  {
    _index: ".infini_agent",
    _type: "_doc",
    _id: "cicm69t3q95ks7ndlntg",
    _score: 1.0,
    _source: {
      id: "cicm69t3q95ks7ndlntg",
      created: "2023-08-02T16:07:12.107567951+08:00",
      updated: "2023-09-28T21:17:16.298924421+08:00",
      name: "Eye",
      endpoint: "https://10.0.0.1:8080",
      version: {
        build_date: "2023-08-02T08:02:06Z",
        build_hash: "4a9f6691463028637731100960929ac779f30f8b",
        build_number: "98",
        eol_date: "2023-12-31T10:10:10Z",
        number: "0.7.0_NIGHTLY",
      },
      basic_auth: {},
      tags: ["default"],
      ips: [
        "192.168.3.181",
        "10.0.0.1",
        "172.17.0.1",
        "172.22.0.1",
        "10.42.0.0",
        "10.42.0.1",
      ],
      major_ip: "192.168.3.181",
      status: "offline",
      host: {
        name: "dell",
        os: { name: "ubuntu", arch: "x86_64", version: "4.15.0-213-generic" },
      },
    },
  },
];

export default {
  "GET /instance/_search": function(req, res) {
    let list = gatewayList;
    if (req.query.application == "agent") {
      list = agentList;
    }
    res.send({
      took: 10,
      timed_out: false,
      hits: {
        total: {
          relation: "eq",
          value: list.length,
        },
        max_score: 1,
        hits: list,
      },
    });
  },
  "POST /instance": function(req, res) {
    let newInstance = {
      _index: ".infini_gateway_instance",
      _type: "_doc",
      _id: new Date().valueOf() + Math.random(),
      _source: {
        ...req.body,
        updated: new Date().toISOString(),
      },
    };
    gatewayList.push(newInstance);
    res.send({
      ...newInstance,
      result: "created",
    });
  },
  "PUT /instance/:instance_id": function(req, res) {
    res.send({
      _id: req.params.instance_id,
      _source: {
        ...req.body,
        updated: new Date().toISOString(),
      },
      result: "updated",
    });
  },
  "DELETE /instance/:instance_id": function(req, res) {
    res.send({
      _id: req.params.instance_id,
      result: "deleted",
    });
  },
  "GET /instance/:instance_id": function(req, res) {
    const instance = gatewayList.find((en) => en._id == req.params.instance_id);
    res.send(instance);
  },
  "POST /instance/try_connect": function(req, res) {
    res.send({
      id: "cjsmv1005f5ldea65t7g",
      name: "HumanTorch",
      application: {
        name: "console",
        version: {
          number: "1.0.0_SNAPSHOT",
          build_hash: "91dad0b3028e560f80d1e91d4d04b0335d1726db",
          build_date: "2023-09-16T08:39:33Z",
          build_number: "001",
          eol_date: "2023-12-31T10:10:10Z",
        },
        tagline: "The easiest way to operate your own search platform.",
      },
      basic_auth: {},
      endpoint: "http://192.168.3.8:2900",
      host: {
        name: "INFINI-4.local",
        os: {
          name: "darwin",
          architecture: "arm64",
          version: "22.6.0",
        },
      },
      network: {
        ip: ["192.168.3.8"],
        major_ip: "192.168.3.8",
      },
    });
  },
  "POST /instance/guide": function(req, res) {
    //input instanceIDs => ["c0oc4kkgq9s8qss2uk80"] elasticsearchID => "c0oc4kkgq9s8qss2uk8x"
    res.send({
      entry: {
        name: `${req.body.name}_entry`,
        enabled: true,
        router: `${req.body.name}_router`,
        max_concurrency: 10000,
        network: {
          binding: "0.0.0.0:8001",
        },
      },
      router: {
        name: `${req.body.name}_router`,
        default_flow: `${req.body.name}_flow`,
      },
      flow: {
        name: `${req.body.name}_flow`,
      },
      filter: [
        { get_cache: {} },
        {
          elasticsearch: {
            elasticsearch: "dev",
            max_connection_per_node: 100,
            max_response_size: -1,
            balancer: "weight",
            refresh: {
              enabled: true,
              interval: "60s",
            },
          },
        },
        { set_cache: {} },
      ],
    });
  },
  "POST /instance/stats": function(req, res) {
    //input instanceIDs => ["cbpmtpgvi0721ejmutag","caa88egvi072aq7ocfs0","cd7qtuatoaj8tj71qck0","cd4ggktath289ject7mg","cd7qaj97tfckbh3lci00","cd21lm1u46ll46iq7o5g"]
    res.send({
      caa88egvi072aq7ocfs0: {
        system: {
          cpu: 21,
          mem: 1368494080,
          uptime_in_ms: 7208445,
        },
      },
      cbpmtpgvi0721ejmutag: {},
      cd21lm1u46ll46iq7o5g: {
        system: {
          cpu: 16,
          mem: 2829025280,
          uptime_in_ms: 99306720,
        },
      },
      cd4ggktath289ject7mg: {
        system: {
          cpu: 13,
          mem: 699457536,
          uptime_in_ms: 21680070,
        },
      },
      cd7qaj97tfckbh3lci00: {},
      cd7qtuatoaj8tj71qck0: {},
      ciclt5t3q95kignnkgkg: {
        system: {
          cgo_calls: 0,
          cpu: 7,
          gc: 62682,
          goroutines: 194,
          mem: 1807024128,
          mspan: 14157792,
          objects: 2169734,
          stack: 7340032,
          sys_in_ms: 37015270,
          uptime_in_ms: 2507470365,
          user_in_ms: 143814020,
        },
      },
      cicm69t3q95ks7ndlntg: {
        system: {
          cgo_calls: 0,
          cpu: 4,
          gc: 51288,
          goroutines: 128,
          mem: 1640443904,
          mspan: 13020336,
          objects: 1839193,
          stack: 5636096,
          sys_in_ms: 31991620,
          uptime_in_ms: 2507491290,
          user_in_ms: 76156680,
        },
      },
    });
  },
  //探针发现接口
  "GET /instance/:instance_id/node/_discovery": (req, res) => {
    res.send({
      nodes: {
        "-N1pmqLWQ-etRKI5B2L4yw": {
          // enrolled: true,
          // cluster_id: "xxxx",
          cluster_info: {
            name: "INFINI-4.local",
            cluster_name: "easysearch",
            cluster_uuid: "843AXmVSQWuyeZKPsliOGA",
            version: {
              number: "1.6.0",
              lucene_version: "8.11.2",
              distribution: "easysearch",
            },
          },
          node_info: {
            name: "INFINI-4.local",
            version: "1.6.0",
            http: {
              bound_address: ["[::1]:9200", "127.0.0.1:9200"],
              publish_address: "127.0.0.1:9200",
              max_content_length_in_bytes: 104857600,
            },
            roles: ["data", "ingest", "master", "remote_cluster_client"],
            transport_address: "127.0.0.1:9300",
            host: "127.0.0.1",
            ip: "127.0.0.1",
            build_flavor: "light",
            build_type: "tar",
            build_hash: "e5d1ff9067b3dd696d52c61fbca1f8daed931fb7",
            total_indexing_buffer: 107374182,
            settings: {
              client: {
                type: "node",
              },
              cluster: {
                name: "easysearch",
              },
              http: {
                compression: "false",
                type:
                  "com.infinilabs.security.http.SecurityHttpServerTransport",
                "type.default": "netty4",
              },
              node: {
                name: "INFINI-4.local",
              },
              path: {
                home: "/opt/easysearch",
                logs: "/opt/easysearch/logs",
              },
              transport: {
                type:
                  "com.infinilabs.security.ssl.http.netty.SecuritySSLNettyTransport",
                "type.default": "netty4",
              },
            },
            os: {
              allocated_processors: 8,
              arch: "aarch64",
              available_processors: 8,
              name: "Mac OS X",
              pretty_name: "Mac OS X",
              refresh_interval_in_millis: 1000,
              version: "14.0",
            },
            process: {
              refresh_interval_in_millis: 1000,
              id: 94275,
              mlockall: false,
            },
            jvm: {
              bundled_jdk: false,
              gc_collectors: ["G1 Young Generation", "G1 Old Generation"],
              input_arguments: [
                "-Xshare:auto",
                "-Des.networkaddress.cache.ttl=60",
                "-Des.networkaddress.cache.negative.ttl=10",
                "-XX:+AlwaysPreTouch",
                "-Xss1m",
                "-Djava.awt.headless=true",
                "-Dfile.encoding=UTF-8",
                "-Djna.nosys=true",
                "-XX:-OmitStackTraceInFastThrow",
                "-XX:+ShowCodeDetailsInExceptionMessages",
                "-Dio.netty.noUnsafe=true",
                "-Dio.netty.noKeySetOptimization=true",
                "-Dio.netty.recycler.maxCapacityPerThread=0",
                "-Dio.netty.allocator.numDirectArenas=0",
                "-Dlog4j.shutdownHookEnabled=false",
                "-Dlog4j2.disable.jmx=true",
                "-Djava.locale.providers=SPI,COMPAT",
                "-Xms1g",
                "-Xmx1g",
                "-XX:+UseG1GC",
                "-XX:G1ReservePercent=25",
                "-XX:InitiatingHeapOccupancyPercent=30",
                "-Djava.io.tmpdir=/var/folders/j5/qd4qt3n55dz053d93q2mswfr0000gn/T/easysearch-10645040137592866215",
                "-XX:+HeapDumpOnOutOfMemoryError",
                "-XX:HeapDumpPath=data",
                "-XX:ErrorFile=logs/hs_err_pid%p.log",
                "-Xlog:gc*,gc+age=trace,safepoint:file=logs/gc.log:utctime,pid,tags:filecount=32,filesize=64m",
                "-XX:MaxDirectMemorySize=536870912",
                "-Des.path.home=/opt/easysearch",
                "-Des.path.conf=/opt/easysearch/config",
                "-Des.distribution.flavor=oss",
                "-Des.distribution.type=tar",
                "-Des.bundled_jdk=false",
              ],
              mem: {
                direct_max_in_bytes: 0,
                heap_init_in_bytes: 1073741824,
                heap_max_in_bytes: 1073741824,
                non_heap_init_in_bytes: 7667712,
                non_heap_max_in_bytes: 0,
              },
              memory_pools: [
                "CodeHeap 'non-nmethods'",
                "Metaspace",
                "CodeHeap 'profiled nmethods'",
                "Compressed Class Space",
                "G1 Eden Space",
                "G1 Old Gen",
                "G1 Survivor Space",
                "CodeHeap 'non-profiled nmethods'",
              ],
              pid: 94275,
              start_time_in_millis: 1697356339396,
              using_bundled_jdk: null,
              using_compressed_ordinary_object_pointers: "true",
              version: "17.0.5",
              vm_name: "OpenJDK 64-Bit Server VM",
              vm_vendor: "Azul Systems, Inc.",
              vm_version: "17.0.5+8-LTS",
            },
            thread_pool: {
              analyze: {
                queue_size: 16,
                size: 1,
                type: "fixed",
              },
              fetch_shard_started: {
                core: 1,
                keep_alive: "5m",
                max: 16,
                queue_size: -1,
                type: "scaling",
              },
              fetch_shard_store: {
                core: 1,
                keep_alive: "5m",
                max: 16,
                queue_size: -1,
                type: "scaling",
              },
              flush: {
                core: 1,
                keep_alive: "5m",
                max: 4,
                queue_size: -1,
                type: "scaling",
              },
              force_merge: {
                queue_size: -1,
                size: 1,
                type: "fixed",
              },
              generic: {
                core: 4,
                keep_alive: "30s",
                max: 128,
                queue_size: -1,
                type: "scaling",
              },
              get: {
                queue_size: 1000,
                size: 8,
                type: "fixed",
              },
              listener: {
                queue_size: -1,
                size: 4,
                type: "fixed",
              },
              management: {
                core: 1,
                keep_alive: "5m",
                max: 5,
                queue_size: -1,
                type: "scaling",
              },
              open_distro_job_scheduler: {
                queue_size: 200,
                size: 8,
                type: "fixed",
              },
              refresh: {
                core: 1,
                keep_alive: "5m",
                max: 4,
                queue_size: -1,
                type: "scaling",
              },
              search: {
                queue_size: 1000,
                size: 13,
                type: "fixed_auto_queue_size",
              },
              search_throttled: {
                queue_size: 100,
                size: 1,
                type: "fixed_auto_queue_size",
              },
              snapshot: {
                core: 1,
                keep_alive: "5m",
                max: 4,
                queue_size: -1,
                type: "scaling",
              },
              system_read: {
                queue_size: 2000,
                size: 4,
                type: "fixed",
              },
              system_write: {
                queue_size: 1000,
                size: 4,
                type: "fixed",
              },
              warmer: {
                core: 1,
                keep_alive: "5m",
                max: 4,
                queue_size: -1,
                type: "scaling",
              },
              write: {
                queue_size: 10000,
                size: 8,
                type: "fixed",
              },
            },
            transport: {
              bound_address: ["[::1]:9300", "127.0.0.1:9300"],
              publish_address: "127.0.0.1:9300",
              profiles: {},
            },
            plugins: [],
            modules: [
              {
                classname:
                  "org.easysearch.search.aggregations.matrix.MatrixAggregationPlugin",
                description:
                  "Adds aggregations whose input are a list of numeric fields and output includes a matrix.",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "aggs-matrix-stats",
                version: "1.6.0",
              },
              {
                classname:
                  "org.easysearch.analysis.common.CommonAnalysisPlugin",
                description: 'Adds "built in" analyzers to Easysearch.',
                easysearch_version: "1.6.0",
                extended_plugins: ["lang-painless"],
                has_native_controller: false,
                java_version: "11",
                name: "analysis-common",
                version: "1.6.0",
              },
              {
                classname:
                  "org.easysearch.index.codec.customcodecs.CustomCodecPlugin",
                description:
                  "A plugin that implements custom compression codecs.",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "custom-codecs",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.geo.GeoPlugin",
                description:
                  "Placeholder plugin for geospatial features in ES. only registers geo_shape field mapper for now",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "geo",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.jobscheduler.JobSchedulerPlugin",
                description: "INFINI Easysearch Job Scheduler Plugin",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "job-scheduler",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.script.expression.ExpressionPlugin",
                description: "Lucene expressions integration for Easysearch",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "lang-expression",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.script.mustache.MustachePlugin",
                description: "Mustache scripting integration for Easysearch",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "lang-mustache",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.painless.PainlessPlugin",
                description:
                  "An easy, safe and fast scripting language for Easysearch",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "lang-painless",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.index.mapper.MapperExtrasPlugin",
                description: "Adds advanced field mappers",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "mapper-extras",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.join.ParentJoinPlugin",
                description:
                  "This module adds the support parent-child queries and aggregations",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "parent-join",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.percolator.PercolatorPlugin",
                description:
                  "Percolator module adds capability to index queries and query these queries by specifying documents",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "percolator",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.index.rankeval.RankEvalPlugin",
                description:
                  "The Rank Eval module adds APIs to evaluate ranking quality.",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "rank-eval",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.index.reindex.ReindexPlugin",
                description:
                  "The Reindex module adds APIs to reindex from one index to another or update documents in place.",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "reindex",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.repositories.s3.S3RepositoryPlugin",
                description: "The S3 repository plugin adds S3 repositories",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "repository-s3",
                version: "1.6.0",
              },
              {
                classname:
                  "org.easysearch.plugin.repository.url.URLRepositoryPlugin",
                description: "Module for URL repository",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "repository-url",
                version: "1.6.0",
              },
              {
                classname: "com.infinilabs.security.SecurityPlugin",
                description: "Integrates Easysearch with security",
                easysearch_version: "1.6.0",
                extended_plugins: ["transport-netty4"],
                has_native_controller: false,
                java_version: "11",
                name: "security",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.transport.Netty4Plugin",
                description: "Netty 4 based transport implementation",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "transport-netty4",
                version: "1.6.0",
              },
            ],
            ingest: {
              processors: [],
            },
            aggregations: {
              adjacency_matrix: {
                types: ["other"],
              },
              auto_date_histogram: {
                types: ["boolean", "date", "numeric"],
              },
              avg: {
                types: ["boolean", "date", "numeric"],
              },
              cardinality: {
                types: [
                  "boolean",
                  "bytes",
                  "date",
                  "geopoint",
                  "ip",
                  "numeric",
                  "range",
                ],
              },
              children: {
                types: ["other"],
              },
              composite: {
                types: ["other"],
              },
              date_histogram: {
                types: ["boolean", "date", "numeric", "range"],
              },
              date_range: {
                types: ["boolean", "date", "numeric"],
              },
              diversified_sampler: {
                types: ["boolean", "bytes", "date", "numeric"],
              },
              extended_stats: {
                types: ["boolean", "date", "numeric"],
              },
              filter: {
                types: ["other"],
              },
              filters: {
                types: ["other"],
              },
              geo_bounds: {
                types: ["geopoint"],
              },
              geo_centroid: {
                types: ["geopoint"],
              },
              geo_distance: {
                types: ["geopoint"],
              },
              geohash_grid: {
                types: ["geopoint"],
              },
              geotile_grid: {
                types: ["geopoint"],
              },
              global: {
                types: ["other"],
              },
              histogram: {
                types: ["boolean", "date", "numeric", "range"],
              },
              ip_range: {
                types: ["ip"],
              },
              matrix_stats: {
                types: ["other"],
              },
              max: {
                types: ["boolean", "date", "numeric"],
              },
              median_absolute_deviation: {
                types: ["numeric"],
              },
              min: {
                types: ["boolean", "date", "numeric"],
              },
              missing: {
                types: [
                  "boolean",
                  "bytes",
                  "date",
                  "geopoint",
                  "ip",
                  "numeric",
                  "range",
                ],
              },
              nested: {
                types: ["other"],
              },
              parent: {
                types: ["other"],
              },
              percentile_ranks: {
                types: ["boolean", "date", "numeric"],
              },
              percentiles: {
                types: ["boolean", "date", "numeric"],
              },
              range: {
                types: ["boolean", "date", "numeric"],
              },
              rare_terms: {
                types: ["boolean", "bytes", "date", "ip", "numeric"],
              },
              reverse_nested: {
                types: ["other"],
              },
              sampler: {
                types: ["other"],
              },
              scripted_metric: {
                types: ["other"],
              },
              significant_terms: {
                types: ["boolean", "bytes", "date", "ip", "numeric"],
              },
              significant_text: {
                types: ["other"],
              },
              stats: {
                types: ["boolean", "date", "numeric"],
              },
              sum: {
                types: ["boolean", "date", "numeric"],
              },
              terms: {
                types: ["boolean", "bytes", "date", "ip", "numeric"],
              },
              top_hits: {
                types: ["other"],
              },
              value_count: {
                types: [
                  "boolean",
                  "bytes",
                  "date",
                  "geopoint",
                  "ip",
                  "numeric",
                  "range",
                ],
              },
              variable_width_histogram: {
                types: ["numeric"],
              },
              weighted_avg: {
                types: ["numeric"],
              },
            },
          },
        },
      },
      unknown_process: [
        {
          pid: 8444,
          name: "java",
          cmdline:
            "/Users/medcl/.sdkman/candidates/java/current/bin/java -Xshare:auto -Des.networkaddress.cache.ttl=60 -Des.networkaddress.cache.negative.ttl=10 -XX:+AlwaysPreTouch -Xss1m -Djava.awt.headless=true -Dfile.encoding=UTF-8 -Djna.nosys=true -XX:-OmitStackTraceInFastThrow -XX:+ShowCodeDetailsInExceptionMessages -Dio.netty.noUnsafe=true -Dio.netty.noKeySetOptimization=true -Dio.netty.recycler.maxCapacityPerThread=0 -Dio.netty.allocator.numDirectArenas=0 -Dlog4j.shutdownHookEnabled=false -Dlog4j2.disable.jmx=true -Djava.locale.providers=SPI,COMPAT -Xms1g -Xmx1g -XX:+UseG1GC -XX:G1ReservePercent=25 -XX:InitiatingHeapOccupancyPercent=30 -Djava.io.tmpdir=/var/folders/j5/qd4qt3n55dz053d93q2mswfr0000gn/T/easysearch-14174566436080777948 -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=data -XX:ErrorFile=logs/hs_err_pid%p.log -Xlog:gc*,gc+age=trace,safepoint:file=logs/gc.log:utctime,pid,tags:filecount=32,filesize=64m -XX:MaxDirectMemorySize=536870912 -Des.path.home=/opt/es1 -Des.path.conf=/opt/es1/config -Des.distribution.flavor=oss -Des.distribution.type=tar -Des.bundled_jdk=false -cp /opt/es1/lib/* org.easysearch.bootstrap.Easysearch",
          create_time: 1697360255872,
          status: "sleep",
          listen_addresses: [
            {
              ip: "::1",
              port: 9301,
            },
            {
              ip: "127.0.0.1",
              port: 9301,
            },
            {
              ip: "::1",
              port: 9201,
            },
            {
              ip: "127.0.0.1",
              port: 9201,
            },
          ],
        },
        {
          pid: 94275,
          name: "java",
          cmdline:
            "/Users/medcl/.sdkman/candidates/java/current/bin/java -Xshare:auto -Des.networkaddress.cache.ttl=60 -Des.networkaddress.cache.negative.ttl=10 -XX:+AlwaysPreTouch -Xss1m -Djava.awt.headless=true -Dfile.encoding=UTF-8 -Djna.nosys=true -XX:-OmitStackTraceInFastThrow -XX:+ShowCodeDetailsInExceptionMessages -Dio.netty.noUnsafe=true -Dio.netty.noKeySetOptimization=true -Dio.netty.recycler.maxCapacityPerThread=0 -Dio.netty.allocator.numDirectArenas=0 -Dlog4j.shutdownHookEnabled=false -Dlog4j2.disable.jmx=true -Djava.locale.providers=SPI,COMPAT -Xms1g -Xmx1g -XX:+UseG1GC -XX:G1ReservePercent=25 -XX:InitiatingHeapOccupancyPercent=30 -Djava.io.tmpdir=/var/folders/j5/qd4qt3n55dz053d93q2mswfr0000gn/T/easysearch-10645040137592866215 -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=data -XX:ErrorFile=logs/hs_err_pid%p.log -Xlog:gc*,gc+age=trace,safepoint:file=logs/gc.log:utctime,pid,tags:filecount=32,filesize=64m -XX:MaxDirectMemorySize=536870912 -Des.path.home=/opt/easysearch -Des.path.conf=/opt/easysearch/config -Des.distribution.flavor=oss -Des.distribution.type=tar -Des.bundled_jdk=false -cp /opt/easysearch/lib/* org.easysearch.bootstrap.Easysearch",
          create_time: 1697356338498,
          status: "sleep",
          listen_addresses: [
            {
              ip: "::1",
              port: 9300,
            },
            {
              ip: "127.0.0.1",
              port: 9300,
            },
            {
              ip: "::1",
              port: 9200,
            },
            {
              ip: "127.0.0.1",
              port: 9200,
            },
          ],
        },
      ],
    });
  },
  //批量关联疑似ES进程
  "POST /instance/:instance_id/node/_discovery": (req, res) => {
    //input cluster_id => ["cbpmtpgvi0721ejmutag","caa88egvi072aq7ocfs0"]
    res.send({
      nodes: {
        "-N1pmqLWQ-etRKI5B2L4yw": {
          // enrolled: true,
          // cluster_id: "xxxx",
          cluster_info: {
            name: "INFINI-4.local-1",
            cluster_name: "easysearch",
            cluster_uuid: "843AXmVSQWuyeZKPsliOGA",
            version: {
              number: "1.6.0",
              lucene_version: "8.11.2",
              distribution: "easysearch",
            },
          },
          node_info: {
            name: "INFINI-4.local-1",
            version: "1.6.0",
            http: {
              bound_address: ["[::1]:9200", "127.0.0.1:9200"],
              publish_address: "127.0.0.1:9200",
              max_content_length_in_bytes: 104857600,
            },
            roles: ["data", "ingest", "master", "remote_cluster_client"],
            transport_address: "127.0.0.1:9300",
            host: "127.0.0.1",
            ip: "127.0.0.1",
            build_flavor: "light",
            build_type: "tar",
            build_hash: "e5d1ff9067b3dd696d52c61fbca1f8daed931fb7",
            total_indexing_buffer: 107374182,
            settings: {
              client: {
                type: "node",
              },
              cluster: {
                name: "easysearch",
              },
              http: {
                compression: "false",
                type:
                  "com.infinilabs.security.http.SecurityHttpServerTransport",
                "type.default": "netty4",
              },
              node: {
                name: "INFINI-4.local",
              },
              path: {
                home: "/opt/easysearch",
                logs: "/opt/easysearch/logs",
              },
              transport: {
                type:
                  "com.infinilabs.security.ssl.http.netty.SecuritySSLNettyTransport",
                "type.default": "netty4",
              },
            },
            os: {
              allocated_processors: 8,
              arch: "aarch64",
              available_processors: 8,
              name: "Mac OS X",
              pretty_name: "Mac OS X",
              refresh_interval_in_millis: 1000,
              version: "14.0",
            },
            process: {
              refresh_interval_in_millis: 1000,
              id: 94275,
              mlockall: false,
            },
            jvm: {
              bundled_jdk: false,
              gc_collectors: ["G1 Young Generation", "G1 Old Generation"],
              input_arguments: [
                "-Xshare:auto",
                "-Des.networkaddress.cache.ttl=60",
                "-Des.networkaddress.cache.negative.ttl=10",
                "-XX:+AlwaysPreTouch",
                "-Xss1m",
                "-Djava.awt.headless=true",
                "-Dfile.encoding=UTF-8",
                "-Djna.nosys=true",
                "-XX:-OmitStackTraceInFastThrow",
                "-XX:+ShowCodeDetailsInExceptionMessages",
                "-Dio.netty.noUnsafe=true",
                "-Dio.netty.noKeySetOptimization=true",
                "-Dio.netty.recycler.maxCapacityPerThread=0",
                "-Dio.netty.allocator.numDirectArenas=0",
                "-Dlog4j.shutdownHookEnabled=false",
                "-Dlog4j2.disable.jmx=true",
                "-Djava.locale.providers=SPI,COMPAT",
                "-Xms1g",
                "-Xmx1g",
                "-XX:+UseG1GC",
                "-XX:G1ReservePercent=25",
                "-XX:InitiatingHeapOccupancyPercent=30",
                "-Djava.io.tmpdir=/var/folders/j5/qd4qt3n55dz053d93q2mswfr0000gn/T/easysearch-10645040137592866215",
                "-XX:+HeapDumpOnOutOfMemoryError",
                "-XX:HeapDumpPath=data",
                "-XX:ErrorFile=logs/hs_err_pid%p.log",
                "-Xlog:gc*,gc+age=trace,safepoint:file=logs/gc.log:utctime,pid,tags:filecount=32,filesize=64m",
                "-XX:MaxDirectMemorySize=536870912",
                "-Des.path.home=/opt/easysearch",
                "-Des.path.conf=/opt/easysearch/config",
                "-Des.distribution.flavor=oss",
                "-Des.distribution.type=tar",
                "-Des.bundled_jdk=false",
              ],
              mem: {
                direct_max_in_bytes: 0,
                heap_init_in_bytes: 1073741824,
                heap_max_in_bytes: 1073741824,
                non_heap_init_in_bytes: 7667712,
                non_heap_max_in_bytes: 0,
              },
              memory_pools: [
                "CodeHeap 'non-nmethods'",
                "Metaspace",
                "CodeHeap 'profiled nmethods'",
                "Compressed Class Space",
                "G1 Eden Space",
                "G1 Old Gen",
                "G1 Survivor Space",
                "CodeHeap 'non-profiled nmethods'",
              ],
              pid: 94275,
              start_time_in_millis: 1697356339396,
              using_bundled_jdk: null,
              using_compressed_ordinary_object_pointers: "true",
              version: "17.0.5",
              vm_name: "OpenJDK 64-Bit Server VM",
              vm_vendor: "Azul Systems, Inc.",
              vm_version: "17.0.5+8-LTS",
            },
            thread_pool: {
              analyze: {
                queue_size: 16,
                size: 1,
                type: "fixed",
              },
              fetch_shard_started: {
                core: 1,
                keep_alive: "5m",
                max: 16,
                queue_size: -1,
                type: "scaling",
              },
              fetch_shard_store: {
                core: 1,
                keep_alive: "5m",
                max: 16,
                queue_size: -1,
                type: "scaling",
              },
              flush: {
                core: 1,
                keep_alive: "5m",
                max: 4,
                queue_size: -1,
                type: "scaling",
              },
              force_merge: {
                queue_size: -1,
                size: 1,
                type: "fixed",
              },
              generic: {
                core: 4,
                keep_alive: "30s",
                max: 128,
                queue_size: -1,
                type: "scaling",
              },
              get: {
                queue_size: 1000,
                size: 8,
                type: "fixed",
              },
              listener: {
                queue_size: -1,
                size: 4,
                type: "fixed",
              },
              management: {
                core: 1,
                keep_alive: "5m",
                max: 5,
                queue_size: -1,
                type: "scaling",
              },
              open_distro_job_scheduler: {
                queue_size: 200,
                size: 8,
                type: "fixed",
              },
              refresh: {
                core: 1,
                keep_alive: "5m",
                max: 4,
                queue_size: -1,
                type: "scaling",
              },
              search: {
                queue_size: 1000,
                size: 13,
                type: "fixed_auto_queue_size",
              },
              search_throttled: {
                queue_size: 100,
                size: 1,
                type: "fixed_auto_queue_size",
              },
              snapshot: {
                core: 1,
                keep_alive: "5m",
                max: 4,
                queue_size: -1,
                type: "scaling",
              },
              system_read: {
                queue_size: 2000,
                size: 4,
                type: "fixed",
              },
              system_write: {
                queue_size: 1000,
                size: 4,
                type: "fixed",
              },
              warmer: {
                core: 1,
                keep_alive: "5m",
                max: 4,
                queue_size: -1,
                type: "scaling",
              },
              write: {
                queue_size: 10000,
                size: 8,
                type: "fixed",
              },
            },
            transport: {
              bound_address: ["[::1]:9300", "127.0.0.1:9300"],
              publish_address: "127.0.0.1:9300",
              profiles: {},
            },
            plugins: [],
            modules: [
              {
                classname:
                  "org.easysearch.search.aggregations.matrix.MatrixAggregationPlugin",
                description:
                  "Adds aggregations whose input are a list of numeric fields and output includes a matrix.",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "aggs-matrix-stats",
                version: "1.6.0",
              },
              {
                classname:
                  "org.easysearch.analysis.common.CommonAnalysisPlugin",
                description: 'Adds "built in" analyzers to Easysearch.',
                easysearch_version: "1.6.0",
                extended_plugins: ["lang-painless"],
                has_native_controller: false,
                java_version: "11",
                name: "analysis-common",
                version: "1.6.0",
              },
              {
                classname:
                  "org.easysearch.index.codec.customcodecs.CustomCodecPlugin",
                description:
                  "A plugin that implements custom compression codecs.",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "custom-codecs",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.geo.GeoPlugin",
                description:
                  "Placeholder plugin for geospatial features in ES. only registers geo_shape field mapper for now",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "geo",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.jobscheduler.JobSchedulerPlugin",
                description: "INFINI Easysearch Job Scheduler Plugin",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "job-scheduler",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.script.expression.ExpressionPlugin",
                description: "Lucene expressions integration for Easysearch",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "lang-expression",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.script.mustache.MustachePlugin",
                description: "Mustache scripting integration for Easysearch",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "lang-mustache",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.painless.PainlessPlugin",
                description:
                  "An easy, safe and fast scripting language for Easysearch",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "lang-painless",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.index.mapper.MapperExtrasPlugin",
                description: "Adds advanced field mappers",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "mapper-extras",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.join.ParentJoinPlugin",
                description:
                  "This module adds the support parent-child queries and aggregations",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "parent-join",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.percolator.PercolatorPlugin",
                description:
                  "Percolator module adds capability to index queries and query these queries by specifying documents",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "percolator",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.index.rankeval.RankEvalPlugin",
                description:
                  "The Rank Eval module adds APIs to evaluate ranking quality.",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "rank-eval",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.index.reindex.ReindexPlugin",
                description:
                  "The Reindex module adds APIs to reindex from one index to another or update documents in place.",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "reindex",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.repositories.s3.S3RepositoryPlugin",
                description: "The S3 repository plugin adds S3 repositories",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "repository-s3",
                version: "1.6.0",
              },
              {
                classname:
                  "org.easysearch.plugin.repository.url.URLRepositoryPlugin",
                description: "Module for URL repository",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "repository-url",
                version: "1.6.0",
              },
              {
                classname: "com.infinilabs.security.SecurityPlugin",
                description: "Integrates Easysearch with security",
                easysearch_version: "1.6.0",
                extended_plugins: ["transport-netty4"],
                has_native_controller: false,
                java_version: "11",
                name: "security",
                version: "1.6.0",
              },
              {
                classname: "org.easysearch.transport.Netty4Plugin",
                description: "Netty 4 based transport implementation",
                easysearch_version: "1.6.0",
                extended_plugins: [],
                has_native_controller: false,
                java_version: "11",
                name: "transport-netty4",
                version: "1.6.0",
              },
            ],
            ingest: {
              processors: [],
            },
            aggregations: {
              adjacency_matrix: {
                types: ["other"],
              },
              auto_date_histogram: {
                types: ["boolean", "date", "numeric"],
              },
              avg: {
                types: ["boolean", "date", "numeric"],
              },
              cardinality: {
                types: [
                  "boolean",
                  "bytes",
                  "date",
                  "geopoint",
                  "ip",
                  "numeric",
                  "range",
                ],
              },
              children: {
                types: ["other"],
              },
              composite: {
                types: ["other"],
              },
              date_histogram: {
                types: ["boolean", "date", "numeric", "range"],
              },
              date_range: {
                types: ["boolean", "date", "numeric"],
              },
              diversified_sampler: {
                types: ["boolean", "bytes", "date", "numeric"],
              },
              extended_stats: {
                types: ["boolean", "date", "numeric"],
              },
              filter: {
                types: ["other"],
              },
              filters: {
                types: ["other"],
              },
              geo_bounds: {
                types: ["geopoint"],
              },
              geo_centroid: {
                types: ["geopoint"],
              },
              geo_distance: {
                types: ["geopoint"],
              },
              geohash_grid: {
                types: ["geopoint"],
              },
              geotile_grid: {
                types: ["geopoint"],
              },
              global: {
                types: ["other"],
              },
              histogram: {
                types: ["boolean", "date", "numeric", "range"],
              },
              ip_range: {
                types: ["ip"],
              },
              matrix_stats: {
                types: ["other"],
              },
              max: {
                types: ["boolean", "date", "numeric"],
              },
              median_absolute_deviation: {
                types: ["numeric"],
              },
              min: {
                types: ["boolean", "date", "numeric"],
              },
              missing: {
                types: [
                  "boolean",
                  "bytes",
                  "date",
                  "geopoint",
                  "ip",
                  "numeric",
                  "range",
                ],
              },
              nested: {
                types: ["other"],
              },
              parent: {
                types: ["other"],
              },
              percentile_ranks: {
                types: ["boolean", "date", "numeric"],
              },
              percentiles: {
                types: ["boolean", "date", "numeric"],
              },
              range: {
                types: ["boolean", "date", "numeric"],
              },
              rare_terms: {
                types: ["boolean", "bytes", "date", "ip", "numeric"],
              },
              reverse_nested: {
                types: ["other"],
              },
              sampler: {
                types: ["other"],
              },
              scripted_metric: {
                types: ["other"],
              },
              significant_terms: {
                types: ["boolean", "bytes", "date", "ip", "numeric"],
              },
              significant_text: {
                types: ["other"],
              },
              stats: {
                types: ["boolean", "date", "numeric"],
              },
              sum: {
                types: ["boolean", "date", "numeric"],
              },
              terms: {
                types: ["boolean", "bytes", "date", "ip", "numeric"],
              },
              top_hits: {
                types: ["other"],
              },
              value_count: {
                types: [
                  "boolean",
                  "bytes",
                  "date",
                  "geopoint",
                  "ip",
                  "numeric",
                  "range",
                ],
              },
              variable_width_histogram: {
                types: ["numeric"],
              },
              weighted_avg: {
                types: ["numeric"],
              },
            },
          },
        },
      },
      unknown_process: [
        {
          pid: 94275,
          name: "java",
          cmdline:
            "/Users/medcl/.sdkman/candidates/java/current/bin/java -Xshare:auto -Des.networkaddress.cache.ttl=60 -Des.networkaddress.cache.negative.ttl=10 -XX:+AlwaysPreTouch -Xss1m -Djava.awt.headless=true -Dfile.encoding=UTF-8 -Djna.nosys=true -XX:-OmitStackTraceInFastThrow -XX:+ShowCodeDetailsInExceptionMessages -Dio.netty.noUnsafe=true -Dio.netty.noKeySetOptimization=true -Dio.netty.recycler.maxCapacityPerThread=0 -Dio.netty.allocator.numDirectArenas=0 -Dlog4j.shutdownHookEnabled=false -Dlog4j2.disable.jmx=true -Djava.locale.providers=SPI,COMPAT -Xms1g -Xmx1g -XX:+UseG1GC -XX:G1ReservePercent=25 -XX:InitiatingHeapOccupancyPercent=30 -Djava.io.tmpdir=/var/folders/j5/qd4qt3n55dz053d93q2mswfr0000gn/T/easysearch-10645040137592866215 -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=data -XX:ErrorFile=logs/hs_err_pid%p.log -Xlog:gc*,gc+age=trace,safepoint:file=logs/gc.log:utctime,pid,tags:filecount=32,filesize=64m -XX:MaxDirectMemorySize=536870912 -Des.path.home=/opt/easysearch -Des.path.conf=/opt/easysearch/config -Des.distribution.flavor=oss -Des.distribution.type=tar -Des.bundled_jdk=false -cp /opt/easysearch/lib/* org.easysearch.bootstrap.Easysearch",
          create_time: 1697356338498,
          status: "sleep",
          listen_addresses: [
            {
              ip: "::1",
              port: 9300,
            },
            {
              ip: "127.0.0.1",
              port: 9300,
            },
            {
              ip: "::1",
              port: 9200,
            },
            {
              ip: "127.0.0.1",
              port: 9200,
            },
          ],
        },
      ],
    });
  },
  //探针关联节点
  "POST /instance/:instance_id/node/_enroll": function(req, res) {
    res.send({
      acknowledged: true,
    });
  },
  //探针解除关联
  "POST /instance/:instance_id/node/_revoke": function(req, res) {
    res.send({
      acknowledged: true,
    });
  },
};
