#agent_config.tpl
#TODO, need to replace cleartext password to keystore, and ingest endpoint
POST $[[SETUP_INDEX_PREFIX]]configs/$[[SETUP_DOC_TYPE]]/system_ingest_config_yml
{
  "payload": {
    "content": "$[[SETUP_SYSTEM_INGEST_CONFIG]]",
    "version": 1,
    "location": "system_ingest_config.yml",
    "name": "system_ingest_config.yml"
  },
  "updated": "2023-10-18T14:49:56.768754+08:00",
  "metadata": {
    "labels": {
      "instance": "_all"
    },
    "category": "app_settings",
    "name": "agent"
  },
  "id": "system_ingest_config_yml"
}

#init_agent_config.tpl
POST $[[SETUP_INDEX_PREFIX]]configs/$[[SETUP_DOC_TYPE]]/task_config_tpl
{
  "payload": {
    "content": "$[[SETUP_TASK_CONFIG_TPL]]",
    "version": 1,
    "location": "task_config.tpl",
    "name": "task_config.tpl"
  },
  "updated": "2023-10-19T14:49:56.768754+08:00",
  "metadata": {
    "labels": {
      "instance": "_all"
    },
    "category": "app_settings",
    "name": "agent"
  },
  "id": "task_config_tpl"
}

#init_gateway_config.tpl
POST $[[SETUP_INDEX_PREFIX]]configs/$[[SETUP_DOC_TYPE]]/agent_relay_gateway_config_yml
{
 "payload": {
    "content": "$[[SETUP_AGENT_RELAY_GATEWAY_CONFIG]]",
    "version": 1,
    "location": "agent_relay_gateway_config.yml",
    "name": "agent_relay_gateway_config.yml"
  },
  "updated": "2023-10-19T14:49:56.768754+08:00",
  "metadata": {
    "labels": {
      "instance": "_all"
    },
    "category": "app_settings",
    "name": "gateway"
  },
  "id": "agent_relay_gateway_config_yml"
}