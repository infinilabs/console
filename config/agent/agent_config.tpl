
#TODO, need to replace cleartext password to keystore, and ingest endpoint
POST .infini_configs/_doc/system_ingest_config_yml
{
  "id": "system_ingest_config_yml",
  "updated": "2023-10-18T14:49:56.768754+08:00",
  "metadata": {
    "category": "app_settings",
    "name": "agent",
    "labels": {
      "instance": "_all"
    }
  },
  "payload": {
    "name": "system_ingest_config.yml",
    "location": "system_ingest_config.yml",
    "content": """

configs.template:
  - name: "default_ingest_config"
    path: ./config/ingest_config.tpl
    variable:
      INGEST_CLUSTER_ID: infini_default_ingest_cluster
      INGEST_CLUSTER_ENDPOINT: [ "http://192.168.3.185:8000" ]
      INGEST_CLUSTER_USERNAME: "ingest"
      INGEST_CLUSTER_PASSWORD: "password"
      CLUSTER_VER: "1.6.0"
      CLUSTER_DISTRIBUTION: "easysearch"
      INDEX_PREFIX: ".infini_"

""",
    "version": 3
  }
}
