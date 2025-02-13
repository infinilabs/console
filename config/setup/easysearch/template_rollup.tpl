DELETE /_rollup/jobs/rollup_index_stats
PUT /_rollup/jobs/rollup_index_stats
{
  "rollup": {
    "source_index": ".infini_metrics",
    "target_index": "rollup_index_stats_{{ctx.source_index}}",
    "timestamp": "timestamp",
    "continuous": true,
    "page_size": 100,
    "cron": "*/10 1-23 * * *",
    "timezone": "UTC",
    "stats": [
          {
            "max": {}
          },
          {
            "min": {}
          },
          {
            "value_count": {}
          }
        ],
    "interval": "1m",
    "identity": [
      "metadata.labels.cluster_id",
      "metadata.labels.cluster_uuid",
      "metadata.labels.index_id",
      "metadata.labels.index_name",
      "metadata.category",
      "payload.elasticsearch.index_stats.index_info.health"
    ],
    "attributes": [
      "agent.*",
      "metadata.*"
    ],
    "metrics": [
      "payload.elasticsearch.index_stats.*"
    ],
    "filter": {
      "metadata.name": "index_stats"
    }
  }
}

DELETE /_rollup/jobs/rollup_index_health
PUT /_rollup/jobs/rollup_index_health
{
  "rollup": {
    "source_index": ".infini_metrics",
    "target_index": "rollup_index_health_{{ctx.source_index}}",
    "timestamp": "timestamp",
    "continuous": true,
    "page_size": 100,
    "cron": "*/10 1-23 * * *",
    "timezone": "UTC",
    "stats": [
          {
            "max": {}
          },
          {
            "value_count": {}
          }
        ],
    "interval": "1m",
    "identity": [
      "metadata.labels.cluster_id",
      "metadata.labels.cluster_uuid",
      "metadata.labels.index_name",
      "metadata.category",
      "payload.elasticsearch.index_health.status"
    ],
    "attributes": [
      "agent.*",
      "metadata.*"
    ],
    "metrics": [
      "payload.elasticsearch.index_health.*"
    ],
    "filter": {
      "metadata.name": "index_health"
    }
  }
}

DELETE /_rollup/jobs/rollup_cluster_stats
PUT /_rollup/jobs/rollup_cluster_stats
{
  "rollup": {
    "source_index": ".infini_metrics",
    "target_index": "rollup_cluster_stats_{{ctx.source_index}}",
    "page_size": 100,
    "continuous": true,
    "cron": "*/10 1-23 * * *",
    "timezone": "UTC",
    "stats": [
      {
        "max": {}
      },
      {
        "value_count": {}
      }
    ],
    "timestamp": "timestamp",
    "interval": "1m",
    "identity": [
      "metadata.labels.cluster_id",
      "metadata.labels.cluster_uuid",
      "metadata.category",
      "payload.elasticsearch.cluster_stats.status"
    ],
    "attributes": [
      "agent.*",
      "metadata.*"
    ],
    "metrics": [
      "payload.elasticsearch.cluster_stats.indices.*",
      "payload.elasticsearch.cluster_stats.nodes.*"
    ],
    "filter": {
      "metadata.name": "cluster_stats"
    }
  }
}

DELETE /_rollup/jobs/rollup_cluster_health
PUT /_rollup/jobs/rollup_cluster_health
{
  "rollup": {
    "source_index": ".infini_metrics",
    "target_index": "rollup_cluster_health_{{ctx.source_index}}",
    "continuous": true,
    "page_size": 100,
    "cron": "*/10 1-23 * * *",
    "timezone": "UTC",
    "stats": [
      {
        "max": {}
      },
      {
        "value_count": {}
      }
    ],
    "timestamp": "timestamp",
    "interval": "1m",
    "identity": [
      "metadata.labels.cluster_id",
      "metadata.labels.cluster_uuid",
      "metadata.category",
      "payload.elasticsearch.cluster_health.status"
    ],
    "attributes": [
      "agent.*",
      "metadata.*"
    ],
    "filter": {
      "metadata.name": "cluster_health"
    },
    "metrics": [
      "payload.elasticsearch.cluster_health.*"
    ]
  }
}

DELETE /_rollup/jobs/rollup_node_stats
PUT /_rollup/jobs/rollup_node_stats
{
  "rollup": {
    "source_index": ".infini_metrics",
    "target_index": "rollup_node_stats_{{ctx.source_index}}",
    "timestamp": "timestamp",
    "continuous": true,
    "page_size": 200,
    "cron": "*/10 1-23 * * *",
    "timezone": "UTC",
    "stats": [
      {
        "max": {}
      },
      {
        "min": {}
      },
      {
        "value_count": {}
      }
    ],
    "special_metrics": [
      {
        "source_field": "payload.elasticsearch.node_stats.process.cpu.percent",
        "metrics": [
          {
            "avg": {}
          },
          {
            "max": {}
          },
          {
            "min": {}
          },
          {
            "percentiles": {}
          }
        ]
      },
      {
        "source_field": "payload.elasticsearch.node_stats.jvm.mem.heap_used_in_bytes",
        "metrics": [
          {
            "avg": {}
          },
          {
            "max": {}
          },
          {
            "min": {}
          },
          {
            "percentiles": {}
          }
        ]
      }
    ],
    "interval": "1m",
    "identity": [
      "metadata.labels.cluster_id",
      "metadata.labels.cluster_uuid",
      "metadata.category",
      "metadata.labels.node_id",
      "metadata.labels.transport_address"
    ],
    "attributes": [
      "agent.*",
      "metadata.*"
    ],
    "filter": {
      "metadata.name": "node_stats"
    },
    "exclude": [
      "payload.elasticsearch.node_stats.http.routes.*"
    ],
    "metrics": [
      "payload.elasticsearch.node_stats.*"
    ]
  }
}

DELETE /_rollup/jobs/rollup_shard_stats_metrics
PUT /_rollup/jobs/rollup_shard_stats_metrics
{
  "rollup": {
    "source_index": ".infini_metrics",
    "target_index": "rollup_shard_stats_metrics_{{ctx.source_index}}",
    "timestamp": "timestamp",
    "continuous": true,
    "page_size": 200,
    "cron": "*/5 1-23 * * *",
    "timezone": "UTC",
    "stats": [
          {
            "max": {}
          },
          {
            "min": {}
          },
          {
            "value_count": {}
          }
        ],
    "interval": "1m",
    "identity": [
      "metadata.labels.cluster_id",
      "metadata.labels.cluster_uuid",
      "metadata.labels.index_id",
      "metadata.labels.index_name",
      "metadata.category",
      "metadata.labels.shard_id"
    ],
    "attributes": [
      "agent.*",
      "metadata.*"
    ],
    "metrics": [
      "payload.elasticsearch.shard_stats.*"
    ],
    "filter": {
      "metadata.name": "shard_stats",
      "payload.elasticsearch.shard_stats.routing.primary": true

    }
  }
}

DELETE /_rollup/jobs/rollup_shard_stats_state
PUT /_rollup/jobs/rollup_shard_stats_state
{
  "rollup": {
    "source_index": ".infini_metrics",
    "target_index": "rollup_shard_stats_state_{{ctx.source_index}}",
    "timestamp": "timestamp",
    "continuous": true,
    "page_size": 100,
    "cron": "*/5 1-23 * * *",
    "timezone": "UTC",
    "stats": [
          {
            "max": {}
          },
          {
            "value_count": {}
          }
        ],
    "interval": "1m",
    "identity": [
      "metadata.labels.cluster_id",
      "metadata.labels.cluster_uuid",
      "metadata.labels.index_name",
      "metadata.category",
      "payload.elasticsearch.shard_stats.routing.state",
      "metadata.labels.node_id"
    ],
    "attributes": [
      "agent.*",
      "metadata.*"
    ],
    "filter": {
      "metadata.name": "shard_stats"
    }
  }
}

# enable rollup search
PUT /_cluster/settings
{
  "persistent": {
    "rollup": {
      "search": {
        "enabled": "true"
      },
      "hours_before": "24"
    }
  }
}

# update index settings
PUT /.easysearch-ilm-config/_settings
{
  "index": {
    "mapping": {
      "nested_fields": {
        "limit": 1000
      },
      "nested_objects": {
        "limit": 20000
      },
      "total_fields": {
        "limit": 30000
      }
    }
  }
}

# ilm settings for rollup indices
DELETE _ilm/policy/ilm_$[[SETUP_INDEX_PREFIX]]rollup-30days-retention
PUT _ilm/policy/ilm_$[[SETUP_INDEX_PREFIX]]rollup-30days-retention
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "30d",
            "max_size": "50gb"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {
            "timestamp_field": "timestamp.date_histogram",
            "min_data_age": "30d"
          }
        }
      }
    }
  }
}

# add ilm policy to rollup indices
#POST _ilm/add/rollup_index_stats_logs-write
#{
#  "policy_id": "ilm_$[[SETUP_INDEX_PREFIX]]rollup-30days-retention"
#}

# start all rollup jobs
POST /_rollup/jobs/rollup*/_start