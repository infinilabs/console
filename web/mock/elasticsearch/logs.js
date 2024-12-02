export default {
    'GET /elasticsearch/:id/logs/server': function(req, res){
        res.send({
                "took": 0,
                "timed_out": false,
                "hits": {
                    "total": {
                        "relation": "eq",
                        "value": 1
                    },
                    "max_score": 1,
                    "hits": [
                        {
                            "_index": ".infini-search-center_logs",
                            "_type": "_doc",
                            "_id": "c0oc4kkgq9s8qss2uk50",
                            "_source": {"type": "server", "timestamp": "2019-01-18T08:55:08,159+0100", "level": "INFO", "component": "o.e.e.NodeEnvironment", "cluster.name": "distribution_run", "node.name": "node-0",  "message": "using [1] data paths, mounts [[/ (/dev/disk1s1)]], net usable_space [181.3gb], net total_space [465.6gb], types [apfs]"  }
                        },
                        {
                            "_index": ".infini-search-center_logs",
                            "_type": "_doc",
                            "_id": "c0oc4kkgq9s8qss2uk51",
                            "_source": {"type": "server", "timestamp": "2019-01-18T08:55:08,167+0100", "level": "WARN", "component": "o.e.n.Node", "cluster.name": "distribution_run", "node.name": "node-0",  "message": "version [7.0.0-SNAPSHOT] is a pre-release version of Elasticsearch and is not suitable for production"  }
                        },
                        {
                            "_index": ".infini-search-center_logs",
                            "_type": "_doc",
                            "_id": "c0oc4kkgq9s8qss2uk52",
                            "_source": {"type": "server", "timestamp": "2019-01-10T11:18:58,523+0100", "level": "ERROR", "component": "test", "cluster.name": "elasticsearch", "node.name": "sample-name",  "message": "error message {\n  \"terms\" : {\n    \"user\" : [\n      \"u1\",\n      \"u2\",\n      \"u3\"\n    ],\n    \"boost\" : 1.0\n  }\n}" , "stacktrace": ["java.lang.Exception: {", "  \"terms\" : {", "    \"user\" : [", "      \"u1\",", "      \"u2\",", "      \"u3\"", "    ],", "    \"boost\" : 1.0", "  }", "}", "at org.elasticsearch.common.logging.JsonLoggerTests.testJsonInStacktraceMessageIsSplitted(JsonLoggerTests.java:159) [test/:?]", "at jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[?:?]", "at jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[?:?]", "at jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[?:?]", "at java.lang.reflect.Method.invoke(Method.java:566) ~[?:?]", "at com.carrotsearch.randomizedtesting.RandomizedRunner.invoke(RandomizedRunner.java:1750) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.RandomizedRunner$8.evaluate(RandomizedRunner.java:938) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.RandomizedRunner$9.evaluate(RandomizedRunner.java:974) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.RandomizedRunner$10.evaluate(RandomizedRunner.java:988) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.rules.StatementAdapter.evaluate(StatementAdapter.java:36) [randomizedtesting-runner-2.7.1.jar:?]", "at org.apache.lucene.util.TestRuleSetupTeardownChained$1.evaluate(TestRuleSetupTeardownChained.java:49) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at org.apache.lucene.util.AbstractBeforeAfterRule$1.evaluate(AbstractBeforeAfterRule.java:45) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at org.apache.lucene.util.TestRuleThreadAndTestName$1.evaluate(TestRuleThreadAndTestName.java:48) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at org.apache.lucene.util.TestRuleIgnoreAfterMaxFailures$1.evaluate(TestRuleIgnoreAfterMaxFailures.java:64) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at org.apache.lucene.util.TestRuleMarkFailure$1.evaluate(TestRuleMarkFailure.java:47) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at com.carrotsearch.randomizedtesting.rules.StatementAdapter.evaluate(StatementAdapter.java:36) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.ThreadLeakControl$StatementRunner.run(ThreadLeakControl.java:368) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.ThreadLeakControl.forkTimeoutingTask(ThreadLeakControl.java:817) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.ThreadLeakControl$3.evaluate(ThreadLeakControl.java:468) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.RandomizedRunner.runSingleTest(RandomizedRunner.java:947) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.RandomizedRunner$5.evaluate(RandomizedRunner.java:832) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.RandomizedRunner$6.evaluate(RandomizedRunner.java:883) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.RandomizedRunner$7.evaluate(RandomizedRunner.java:894) [randomizedtesting-runner-2.7.1.jar:?]", "at org.apache.lucene.util.AbstractBeforeAfterRule$1.evaluate(AbstractBeforeAfterRule.java:45) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at com.carrotsearch.randomizedtesting.rules.StatementAdapter.evaluate(StatementAdapter.java:36) [randomizedtesting-runner-2.7.1.jar:?]", "at org.apache.lucene.util.TestRuleStoreClassName$1.evaluate(TestRuleStoreClassName.java:41) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at com.carrotsearch.randomizedtesting.rules.NoShadowingOrOverridesOnMethodsRule$1.evaluate(NoShadowingOrOverridesOnMethodsRule.java:40) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.rules.NoShadowingOrOverridesOnMethodsRule$1.evaluate(NoShadowingOrOverridesOnMethodsRule.java:40) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.rules.StatementAdapter.evaluate(StatementAdapter.java:36) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.rules.StatementAdapter.evaluate(StatementAdapter.java:36) [randomizedtesting-runner-2.7.1.jar:?]", "at org.apache.lucene.util.TestRuleAssertionsRequired$1.evaluate(TestRuleAssertionsRequired.java:53) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at org.apache.lucene.util.TestRuleMarkFailure$1.evaluate(TestRuleMarkFailure.java:47) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at org.apache.lucene.util.TestRuleIgnoreAfterMaxFailures$1.evaluate(TestRuleIgnoreAfterMaxFailures.java:64) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at org.apache.lucene.util.TestRuleIgnoreTestSuites$1.evaluate(TestRuleIgnoreTestSuites.java:54) [lucene-test-framework-8.0.0-snapshot-a1c6e642aa.jar:8.0.0-snapshot-a1c6e642aa a1c6e642aad90d3615b4c71bf261a5aad7e32369 - nknize - 2019-01-02 14:49:38]", "at com.carrotsearch.randomizedtesting.rules.StatementAdapter.evaluate(StatementAdapter.java:36) [randomizedtesting-runner-2.7.1.jar:?]", "at com.carrotsearch.randomizedtesting.ThreadLeakControl$StatementRunner.run(ThreadLeakControl.java:368) [randomizedtesting-runner-2.7.1.jar:?]", "at java.lang.Thread.run(Thread.java:834) [?:?]"] }
                        }
                    ]
                }
            });
    },
    'GET /elasticsearch/:id/logs/gc': function(req, res){
        res.send({
            "took": 0,
            "timed_out": false,
            "hits": {
                "total": {
                    "relation": "eq",
                    "value": 1
                },
                "max_score": 1,
                "hits": [
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk50",
                        "_source":  {
                            "@timestamp": "2018-06-13T07:44:23.072Z",
                            "elasticsearch.gc.tags": [
                                "safepoint"
                            ],
                            "event.category": "database",
                            "event.dataset": "elasticsearch.gc",
                            "event.kind": "metric",
                            "event.module": "elasticsearch",
                            "event.type": "info",
                            "fileset.name": "gc",
                            "input.type": "log",
                            "log.offset": 1575,
                            "message": "Total time for which application threads were stopped: 0,0002664 seconds, Stopping threads took: 0,0000334 seconds",
                            "process.pid": "32376",
                            "service.type": "elasticsearch"
                        } },
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk51",
                        "_source":  {
                            "@timestamp": "2018-06-13T07:44:23.105Z",
                            "elasticsearch.gc.tags": [
                                "safepoint"
                            ],
                            "event.category": "database",
                            "event.dataset": "elasticsearch.gc",
                            "event.kind": "metric",
                            "event.module": "elasticsearch",
                            "event.type": "info",
                            "fileset.name": "gc",
                            "input.type": "log",
                            "log.offset": 1832,
                            "message": "Total time for which application threads were stopped: 0,0001472 seconds, Stopping threads took: 0,0000279 seconds",
                            "process.pid": "32376",
                            "service.type": "elasticsearch"
                        } },
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk52",
                        "_source": {
                            "@timestamp": "2018-06-13T07:44:23.526Z",
                            "elasticsearch.gc.tags": [
                                "safepoint"
                            ],
                            "event.category": "database",
                            "event.dataset": "elasticsearch.gc",
                            "event.kind": "metric",
                            "event.module": "elasticsearch",
                            "event.type": "info",
                            "fileset.name": "gc",
                            "input.type": "log",
                            "log.offset": 2346,
                            "message": "Total time for which application threads were stopped: 0,0002301 seconds, Stopping threads took: 0,0000177 seconds",
                            "process.pid": "32376",
                            "service.type": "elasticsearch"
                        } }
                ]
            }
        });
    },
    'GET /elasticsearch/:id/logs/deprecation': function(req, res){
        res.send({
            "took": 0,
            "timed_out": false,
            "hits": {
                "total": {
                    "relation": "eq",
                    "value": 1
                },
                "max_score": 1,
                "hits": [
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk50",
                        "_source":  {
                            "@timestamp": "2018-04-23T16:40:13.737-02:00",
                            "elasticsearch.component": "o.e.d.a.a.i.t.p.PutIndexTemplateRequest",
                            "event.category": "database",
                            "event.dataset": "elasticsearch.deprecation",
                            "event.kind": "event",
                            "event.module": "elasticsearch",
                            "event.timezone": "-02:00",
                            "event.type": "info",
                            "fileset.name": "deprecation",
                            "input.type": "log",
                            "log.level": "WARN",
                            "log.offset": 0,
                            "message": "Deprecated field [template] used, replaced by [index_patterns]",
                            "service.type": "elasticsearch"
                        } },
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk51",
                        "_source":  {
                            "@timestamp": "2018-04-23T16:40:13.862-02:00",
                            "elasticsearch.component": "o.e.d.a.a.i.t.p.PutIndexTemplateRequest",
                            "event.category": "database",
                            "event.dataset": "elasticsearch.deprecation",
                            "event.kind": "event",
                            "event.module": "elasticsearch",
                            "event.timezone": "-02:00",
                            "event.type": "info",
                            "fileset.name": "deprecation",
                            "input.type": "log",
                            "log.level": "WARN",
                            "log.offset": 137,
                            "message": "Deprecated field [template] used, replaced by [index_patterns]",
                            "service.type": "elasticsearch"
                        } },
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk52",
                        "_source": {
                            "@timestamp": "2018-04-23T16:40:15.127-02:00",
                            "elasticsearch.component": "o.e.d.a.a.i.t.p.PutIndexTemplateRequest",
                            "event.category": "database",
                            "event.dataset": "elasticsearch.deprecation",
                            "event.kind": "event",
                            "event.module": "elasticsearch",
                            "event.timezone": "-02:00",
                            "event.type": "info",
                            "fileset.name": "deprecation",
                            "input.type": "log",
                            "log.level": "WARN",
                            "log.offset": 411,
                            "message": "Deprecated field [template] used, replaced by [index_patterns]",
                            "service.type": "elasticsearch"
                        } }
                ]
            }
        });
    },
    'GET /elasticsearch/:id/logs/audit': function(req, res){
        res.send({
            "took": 0,
            "timed_out": false,
            "hits": {
                "total": {
                    "relation": "eq",
                    "value": 1
                },
                "max_score": 1,
                "hits": [
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk50",
                        "_source":   {
                            "@timestamp": "2019-09-05T16:02:37.921Z",
                            "elasticsearch.audit.action": "indices:monitor/stats",
                            "elasticsearch.audit.layer": "transport",
                            "elasticsearch.audit.origin.type": "local_node",
                            "elasticsearch.audit.realm": "__fallback",
                            "elasticsearch.audit.request.id": "474ZciqtQteOhjLO3OdZIw",
                            "elasticsearch.audit.request.name": "IndicesStatsRequest",
                            "elasticsearch.node.id": "UwRu4mReRtyJO1-FWAPvIQ",
                            "event.action": "authentication_success",
                            "event.category": "database",
                            "event.dataset": "elasticsearch.audit",
                            "event.kind": "event",
                            "event.module": "elasticsearch",
                            "event.outcome": "success",
                            "event.timezone": "-02:00",
                            "fileset.name": "audit",
                            "host.id": "UwRu4mReRtyJO1-FWAPvIQ",
                            "input.type": "log",
                            "log.offset": 0,
                            "message": "{\"@timestamp\":\"2019-09-05T14:02:37,921\", \"node.id\":\"UwRu4mReRtyJO1-FWAPvIQ\", \"event.type\":\"transport\", \"event.action\":\"authentication_success\", \"user.name\":\"_system\", \"origin.type\":\"local_node\", \"origin.address\":\"127.0.0.1:9300\", \"realm\":\"__fallback\", \"request.id\":\"474ZciqtQteOhjLO3OdZIw\", \"action\":\"indices:monitor/stats\", \"request.name\":\"IndicesStatsRequest\"}",
                            "related.user": [
                                "_system"
                            ],
                            "service.type": "elasticsearch",
                            "source.address": "127.0.0.1:9300",
                            "source.ip": "127.0.0.1",
                            "source.port": 9300,
                            "user.name": "_system"
                        } },
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk51",
                        "_source":  {
                            "@timestamp": "2020-01-29T11:41:10.856Z",
                            "elasticsearch.audit.action": "cluster:admin/xpack/security/realm/cache/clear",
                            "elasticsearch.audit.layer": "transport",
                            "elasticsearch.audit.origin.type": "local_node",
                            "elasticsearch.audit.request.id": "I9bQCw28Qfe4HWtIJHgoAg",
                            "elasticsearch.audit.request.name": "ClearRealmCacheRequest",
                            "elasticsearch.audit.user.realm": "__attach",
                            "elasticsearch.audit.user.roles": [
                                "superuser"
                            ],
                            "elasticsearch.node.id": "DJKjhISiTzy-JY5nCU8h3Q",
                            "event.action": "access_granted",
                            "event.category": "database",
                            "event.dataset": "elasticsearch.audit",
                            "event.kind": "event",
                            "event.module": "elasticsearch",
                            "event.outcome": "success",
                            "event.timezone": "-02:00",
                            "fileset.name": "audit",
                            "host.id": "DJKjhISiTzy-JY5nCU8h3Q",
                            "input.type": "log",
                            "log.offset": 363,
                            "message": "{\"@timestamp\":\"2020-01-29T09:41:10,856\", \"node.id\":\"DJKjhISiTzy-JY5nCU8h3Q\", \"event.type\":\"transport\", \"event.action\":\"access_granted\", \"user.name\":\"_xpack_security\", \"user.realm\":\"__attach\", \"user.roles\":[\"superuser\"], \"origin.type\":\"local_node\", \"origin.address\":\"127.0.0.1:9300\", \"request.id\":\"I9bQCw28Qfe4HWtIJHgoAg\", \"action\":\"cluster:admin/xpack/security/realm/cache/clear\", \"request.name\":\"ClearRealmCacheRequest\"}",
                            "related.user": [
                                "_xpack_security"
                            ],
                            "service.type": "elasticsearch",
                            "source.address": "127.0.0.1:9300",
                            "source.ip": "127.0.0.1",
                            "source.port": 9300,
                            "user.name": "_xpack_security"
                        } },
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk52",
                        "_source": {
                            "@timestamp": "2020-01-29T11:41:10.859Z",
                            "elasticsearch.audit.action": "cluster:admin/xpack/security/realm/cache/clear[n]",
                            "elasticsearch.audit.layer": "transport",
                            "elasticsearch.audit.origin.type": "local_node",
                            "elasticsearch.audit.request.id": "I9bQCw28Qfe4HWtIJHgoAg",
                            "elasticsearch.audit.request.name": "Node",
                            "elasticsearch.audit.user.realm": "__attach",
                            "elasticsearch.audit.user.roles": [
                                "superuser"
                            ],
                            "elasticsearch.node.id": "DJKjhISiTzy-JY5nCU8h3Q",
                            "event.action": "access_granted",
                            "event.category": "database",
                            "event.dataset": "elasticsearch.audit",
                            "event.kind": "event",
                            "event.module": "elasticsearch",
                            "event.outcome": "success",
                            "event.timezone": "-02:00",
                            "fileset.name": "audit",
                            "host.id": "DJKjhISiTzy-JY5nCU8h3Q",
                            "input.type": "log",
                            "log.offset": 785,
                            "message": "{\"@timestamp\":\"2020-01-29T09:41:10,859\", \"node.id\":\"DJKjhISiTzy-JY5nCU8h3Q\", \"event.type\":\"transport\", \"event.action\":\"access_granted\", \"user.name\":\"_xpack_security\", \"user.realm\":\"__attach\", \"user.roles\":[\"superuser\"], \"origin.type\":\"local_node\", \"origin.address\":\"127.0.0.1:9300\", \"request.id\":\"I9bQCw28Qfe4HWtIJHgoAg\", \"action\":\"cluster:admin/xpack/security/realm/cache/clear[n]\", \"request.name\":\"Node\"}",
                            "related.user": [
                                "_xpack_security"
                            ],
                            "service.type": "elasticsearch",
                            "source.address": "127.0.0.1:9300",
                            "source.ip": "127.0.0.1",
                            "source.port": 9300,
                            "user.name": "_xpack_security"
                        } }
                ]
            }
        });
    },
    'GET /elasticsearch/:id/logs/indexing_slowlog': function(req, res){
        res.send({
            "took": 0,
            "timed_out": false,
            "hits": {
                "total": {
                    "relation": "eq",
                    "value": 1
                },
                "max_score": 1,
                "hits": [
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk50",
                        "_source":   {
                            "@timestamp": "2019-06-24T19:01:11.415Z",
                            "elasticsearch.cluster.name": "esprod",
                            "elasticsearch.cluster.uuid": "b28RGuVmRDimbAkNTVbacg",
                            "elasticsearch.component": "i.i.s.index",
                            "elasticsearch.index.id": "6cpavWDYRO6pyxezB0LepA",
                            "elasticsearch.index.name": "foo",
                            "elasticsearch.node.id": "erxPlzmKQOGUdrDxGrww_g",
                            "elasticsearch.node.name": "esprod0",
                            "elasticsearch.slowlog.id": "1",
                            "elasticsearch.slowlog.routing": "",
                            "elasticsearch.slowlog.source": "{\"foo\":\"bar\"}",
                            "elasticsearch.slowlog.took": "3ms",
                            "elasticsearch.slowlog.types": "t",
                            "event.category": "database",
                            "event.dataset": "elasticsearch.slowlog",
                            "event.duration": 3000000,
                            "event.kind": "event",
                            "event.module": "elasticsearch",
                            "event.type": "info",
                            "fileset.name": "slowlog",
                            "host.id": "erxPlzmKQOGUdrDxGrww_g",
                            "input.type": "log",
                            "log.level": "WARN",
                            "log.offset": 0,
                            "message": "{\"type\": \"index_indexing_slowlog\", \"timestamp\": \"2019-06-24T15:01:11,415-04:00\", \"level\": \"WARN\", \"component\": \"i.i.s.index\", \"cluster.name\": \"esprod\", \"node.name\": \"esprod0\", \"message\": \"[foo/6cpavWDYRO6pyxezB0LepA]\", \"took\": \"3ms\", \"took_millis\": \"3\", \"doc_type\": \"t\", \"id\": \"1\", \"routing\": \"\", \"source\": \"{\\\"foo\\\":\\\"bar\\\"}\", \"cluster.uuid\": \"b28RGuVmRDimbAkNTVbacg\", \"node.id\": \"erxPlzmKQOGUdrDxGrww_g\"  }",
                            "service.type": "elasticsearch"
                        }},
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk51",
                        "_source": {
                            "@timestamp": "2019-07-09T08:48:28.203Z",
                            "elasticsearch.cluster.name": "es1",
                            "elasticsearch.cluster.uuid": "xOp8Gs9TTa-SoSWcs6NZHg",
                            "elasticsearch.component": "i.i.s.index",
                            "elasticsearch.index.id": "DubP3paOQJCtD1EkUmqxpw",
                            "elasticsearch.index.name": "foo",
                            "elasticsearch.node.id": "BgSzU7SUTgeRYqzbiyf1sA",
                            "elasticsearch.node.name": "es1_1",
                            "elasticsearch.slowlog.id": "1",
                            "elasticsearch.slowlog.source": "{\"foo\":\"bar\"}",
                            "elasticsearch.slowlog.took": "2.3ms",
                            "elasticsearch.slowlog.types": "_doc",
                            "event.category": "database",
                            "event.dataset": "elasticsearch.slowlog",
                            "event.duration": 2000000,
                            "event.kind": "event",
                            "event.module": "elasticsearch",
                            "event.type": "info",
                            "fileset.name": "slowlog",
                            "host.id": "BgSzU7SUTgeRYqzbiyf1sA",
                            "input.type": "log",
                            "log.level": "WARN",
                            "log.offset": 409,
                            "message": "{\"type\": \"index_indexing_slowlog\", \"timestamp\": \"2019-07-09T04:48:28,203-04:00\", \"level\": \"WARN\", \"component\": \"i.i.s.index\", \"cluster.name\": \"es1\", \"node.name\": \"es1_1\", \"message\": \"[foo/DubP3paOQJCtD1EkUmqxpw]\", \"took\": \"2.3ms\", \"took_millis\": \"2\", \"doc_type\": \"_doc\", \"id\": \"1\", \"source\": \"{\\\"foo\\\":\\\"bar\\\"}\", \"cluster.uuid\": \"xOp8Gs9TTa-SoSWcs6NZHg\", \"node.id\": \"BgSzU7SUTgeRYqzbiyf1sA\"  }",
                            "service.type": "elasticsearch"
                        } }
                ]
            }
        });
    },
    'GET /elasticsearch/:id/logs/search_slowlog': function(req, res){
        res.send({
            "took": 0,
            "timed_out": false,
            "hits": {
                "total": {
                    "relation": "eq",
                    "value": 1
                },
                "max_score": 1,
                "hits": [
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk50",
                        "_source":  {
                            "@timestamp": "2019-01-29T07:31:40.426Z",
                            "elasticsearch.cluster.name": "distribution_run",
                            "elasticsearch.cluster.uuid": "oqKkg2eoQh2P_KrKliI3DA",
                            "elasticsearch.component": "i.s.s.query",
                            "elasticsearch.index.name": "index1",
                            "elasticsearch.node.id": "U7rdLkcqR9eRvOiyLmr_qQ",
                            "elasticsearch.node.name": "node-0",
                            "elasticsearch.shard.id": "0",
                            "elasticsearch.slowlog.took": "70.4micros",
                            "event.category": "database",
                            "event.dataset": "elasticsearch.slowlog",
                            "event.duration": 0,
                            "event.kind": "event",
                            "event.module": "elasticsearch",
                            "event.type": "info",
                            "fileset.name": "slowlog",
                            "host.id": "U7rdLkcqR9eRvOiyLmr_qQ",
                            "input.type": "log",
                            "log.level": "WARN",
                            "log.offset": 0,
                            "message": "{\"type\": \"index_search_slowlog\", \"timestamp\": \"2019-01-29T08:31:40,426+0100\", \"level\": \"WARN\", \"component\": \"i.s.s.query\", \"cluster.name\": \"distribution_run\", \"node.name\": \"node-0\", \"cluster.uuid\": \"oqKkg2eoQh2P_KrKliI3DA\", \"node.id\": \"U7rdLkcqR9eRvOiyLmr_qQ\",  \"message\": \"[index1][0] took[70.4micros], took_millis[0], total_hits[0 hits], types[], stats[], search_type[QUERY_THEN_FETCH], total_shards[1], source[{}], id[], \"  }",
                            "service.type": "elasticsearch"
                        }},
                    {
                        "_index": ".infini-search-center_logs",
                        "_type": "_doc",
                        "_id": "c0oc4kkgq9s8qss2uk51",
                        "_source":{
                            "@timestamp": "2019-01-29T07:36:01.675Z",
                            "elasticsearch.cluster.name": "distribution_run",
                            "elasticsearch.cluster.uuid": "oqKkg2eoQh2P_KrKliI3DA",
                            "elasticsearch.component": "i.s.s.query",
                            "elasticsearch.index.name": "index1",
                            "elasticsearch.node.id": "U7rdLkcqR9eRvOiyLmr_qQ",
                            "elasticsearch.node.name": "node-0",
                            "elasticsearch.shard.id": "0",
                            "elasticsearch.slowlog.took": "731.3micros",
                            "event.category": "database",
                            "event.dataset": "elasticsearch.slowlog",
                            "event.duration": 0,
                            "event.kind": "event",
                            "event.module": "elasticsearch",
                            "event.type": "info",
                            "fileset.name": "slowlog",
                            "host.id": "U7rdLkcqR9eRvOiyLmr_qQ",
                            "input.type": "log",
                            "log.level": "WARN",
                            "log.offset": 429,
                            "message": "{\"type\": \"index_search_slowlog\", \"timestamp\": \"2019-01-29T08:36:01,675+0100\", \"level\": \"WARN\", \"component\": \"i.s.s.query\", \"cluster.name\": \"distribution_run\", \"node.name\": \"node-0\", \"cluster.uuid\": \"oqKkg2eoQh2P_KrKliI3DA\", \"node.id\": \"U7rdLkcqR9eRvOiyLmr_qQ\",  \"message\": \"[index1][0] took[731.3micros], took_millis[0], total_hits[2 hits], types[], stats[], search_type[QUERY_THEN_FETCH], total_shards[1], source[{}], id[], \"  }",
                            "service.type": "elasticsearch"
                        } }
                ]
            }
        });
    },
}
