// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

const savedObjectsResult = {"page":1,"per_page":10000,"total":4,"saved_objects":[{"type":"index-pattern","id":"c7fbafd0-34a9-11eb-925f-9db57376c4ce","attributes":{"title":".monitoring-es-7-mb-*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2020-12-02T14:34:38.010Z","version":"WzgyNCw3XQ==","namespaces":["default"],"score":0},{"type":"index-pattern","id":"861ea7f0-3a9b-11eb-9b55-45d33507027a","attributes":{"title":"mock_log*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2020-12-10T04:09:09.044Z","version":"WzE3NTgsMTBd","namespaces":["default"],"score":0},{"type":"index-pattern","id":"1a28c950-0f6b-11eb-9512-2d0c0eda237d","attributes":{"title":"gateway_requests*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2021-05-22T11:04:23.811Z","version":"WzkxMTgsNDhd","namespaces":["default"],"score":0},{"type":"index-pattern","id":"1ccce5c0-bb9a-11eb-957b-939add21a246","attributes":{"title":"test-custom*"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"},"updated_at":"2021-06-03T14:51:14.139Z","version":"WzEwMTEzLDQ4XQ==","namespaces":["default"],"score":0}]};

const resolveIndexResult1 = {"indices":[{"name":".apm-agent-configuration","attributes":["open"]},{"name":".apm-custom-link","attributes":["open"]},{"name":".async-search","attributes":["open"]},{"name":".infini-search-center_cluster","attributes":["open"]},{"name":".infini-search-center_dict","attributes":["open"]},{"name":".infini-search-center_monitoring","attributes":["open"]},{"name":".infini-search-center_reindex","attributes":["open"]},{"name":".infini-search-center_searchtemplate","attributes":["open"]},{"name":".infini-search-center_searchtemplatehistory","attributes":["open"]},{"name":".kibana-event-log-7.10.0-000004","aliases":[".kibana-event-log-7.10.0"],"attributes":["open"]},{"name":".kibana-event-log-7.10.0-000005","aliases":[".kibana-event-log-7.10.0"],"attributes":["open"]},{"name":".kibana-event-log-7.10.0-000006","aliases":[".kibana-event-log-7.10.0"],"attributes":["open"]},{"name":".kibana-event-log-7.10.0-000007","aliases":[".kibana-event-log-7.10.0"],"attributes":["open"]},{"name":".kibana_1","aliases":[".kibana"],"attributes":["open"]},{"name":".kibana_2","attributes":["open"]},{"name":".kibana_task_manager_1","aliases":[".kibana_task_manager"],"attributes":["open"]},{"name":".tasks","attributes":["open"]},{"name":"cluster","attributes":["open"]},{"name":"dict","attributes":["open"]},{"name":"gateway_requests","attributes":["open"]},{"name":"infini-dict","attributes":["open"]},{"name":"infini-reindex","attributes":["open"]},{"name":"metricbeat-7.10.0-2021.02.03-000001","aliases":["metricbeat-7.10.0"],"attributes":["open"]},{"name":"metricbeat-7.10.0-2021.03.06-000002","aliases":["metricbeat-7.10.0"],"attributes":["open"]},{"name":"metricbeat-7.10.0-2021.04.07-000003","aliases":["metricbeat-7.10.0"],"attributes":["open"]},{"name":"metricbeat-7.10.0-2021.05.07-000004","aliases":["metricbeat-7.10.0"],"attributes":["open"]},{"name":"metricbeat-7.10.0-2021.06.06-000005","aliases":["metricbeat-7.10.0"],"attributes":["open"]},{"name":"mock_log","attributes":["open"]},{"name":"nginx_mock_log","attributes":["open"]},{"name":"reindex","attributes":["open"]},{"name":"test-custom","aliases":["custom"],"attributes":["open"]},{"name":"test-custom1","aliases":["custom"],"attributes":["open"]},{"name":"test-custom8","aliases":["custom"],"attributes":["open"]},{"name":"test-custom9","aliases":["custom"],"attributes":["open"]}],"aliases":[{"name":".kibana","indices":[".kibana_1"]},{"name":".kibana-event-log-7.10.0","indices":[".kibana-event-log-7.10.0-000004",".kibana-event-log-7.10.0-000005",".kibana-event-log-7.10.0-000006",".kibana-event-log-7.10.0-000007"]},{"name":".kibana_task_manager","indices":[".kibana_task_manager_1"]},{"name":"custom","indices":["test-custom","test-custom1","test-custom8","test-custom9"]},{"name":"metricbeat-7.10.0","indices":["metricbeat-7.10.0-2021.02.03-000001","metricbeat-7.10.0-2021.03.06-000002","metricbeat-7.10.0-2021.04.07-000003","metricbeat-7.10.0-2021.05.07-000004","metricbeat-7.10.0-2021.06.06-000005"]}],"data_streams":[]};

const resolveIndexResult2 = {"indices":[],"aliases":[],"data_streams":[]};

export default {
  'GET /elasticsearch/:clusterID/saved_objects/_find': (req, res) =>{
    return res.json(savedObjectsResult);
  },
  'GET /elasticsearch/:clusterID/internal/index-pattern-management/resolve_index/:pattern': (req, res)=>{
    const {pattern} = req.params;
    if(pattern == '*')
      return res.json(resolveIndexResult1);
    else if(pattern == '*:*'){
      return res.json(resolveIndexResult2);
    }else{
      const result = {...resolveIndexResult1};
      result.aliases = result.aliases.filter(alias=>alias.name.startsWith(pattern.replace('*', '')))
      result.indices = result.indices.filter(index=>index.name.startsWith(pattern.replace('*', '')))
      return res.json(result);
    }
  },
  'POST /elasticsearch/:clusterID/saved_objects/_bulk_get': (req, res) => {
    if(req.body && req.body.length > 0 ){
      let mockObj = 
          {
            "attributes": {
              "fields": "[{\"count\":0,\"name\":\"_id\",\"type\":\"string\",\"esTypes\":[\"_id\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"esTypes\":[\"_index\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_score\",\"type\":\"number\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"esTypes\":[\"_source\"],\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"esTypes\":[\"_type\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"address\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"address.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"address\"}}},{\"count\":0,\"conflictDescriptions\":{\"text\":[\"test-custom1\"],\"long\":[\"test-custom\",\"test-custom8\",\"test-custom9\"]},\"name\":\"age\",\"type\":\"conflict\",\"esTypes\":[\"text\",\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"age.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"age\"}}},{\"count\":0,\"name\":\"created_at\",\"type\":\"date\",\"esTypes\":[\"date\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"email\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"email.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"email\"}}},{\"count\":0,\"name\":\"hobbies\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"hobbies.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"hobbies\"}}},{\"count\":0,\"name\":\"id\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"id.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"id\"}}},{\"count\":0,\"name\":\"name\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"name.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"name\"}}}]",
              "timeFieldName": "created_at",
              "title": "test*",
              "fieldFormatMap": `{"age":{"id":"bytes","params":{"parsedUrl":{"origin":"http://localhost:9000","pathname":"/","basePath":""}}}}`,
            },
            "id": "1ccce5c0-bb9a-11eb-957b-939add21a246",
            "migrationVersion": {
              "index-pattern": "7.6.0"
            },
            "namespaces": [
              "default"
            ],
            "score": 0,
            "type": "index-pattern",
            "updated_at": "2021-06-27T10:13:23.639105+08:00",
            // "version":"WzEwMTEzLDQ4XQ=="

      }//({"id":"1ccce5c0-bb9a-11eb-957b-939add21a246","type":"index-pattern","namespaces":["default"],"updated_at":"2021-06-03T14:51:14.139Z","version":"WzEwMTEzLDQ4XQ==","attributes":{"title":"test-custom*","timeFieldName":"created_at","fields":"[{\"count\":4,\"name\":\"_id\",\"type\":\"string\",\"esTypes\":[\"_id\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"esTypes\":[\"_index\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_score\",\"type\":\"number\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"esTypes\":[\"_source\"],\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"esTypes\":[\"_type\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":4,\"name\":\"address\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"address.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"address\"}}},{\"count\":0,\"conflictDescriptions\":{\"text\":[\"test-custom1\"],\"long\":[\"test-custom\",\"test-custom8\",\"test-custom9\"]},\"name\":\"age\",\"type\":\"conflict\",\"esTypes\":[\"text\",\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"age.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"age\"}}},{\"count\":0,\"name\":\"created_at\",\"type\":\"date\",\"esTypes\":[\"date\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":3,\"name\":\"email\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"email.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"email\"}}},{\"count\":0,\"name\":\"hobbies\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"hobbies.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"hobbies\"}}},{\"count\":0,\"name\":\"id\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"id.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"id\"}}},{\"count\":0,\"name\":\"name\",\"type\":\"string\",\"esTypes\":[\"text\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"name.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"name\"}}}]"},"references":[],"migrationVersion":{"index-pattern":"7.6.0"}});
      let savedObjects = [];
      req.body.forEach((reqObj)=>{
        savedObjects.push({
          ...mockObj,
          id: reqObj.id,
        })
      })
      return res.json({
        saved_objects: savedObjects,
      })
    }
    return res.json({"saved_objects":[{"id":"telemetry","type":"telemetry","namespaces":[],"updated_at":"2020-11-23T11:30:51.234Z","version":"WzgsMV0=","attributes":{"userHasSeenNotice":true},"references":[]}]});
  },
  'GET /elasticsearch/:clusterID/index_patterns/_fields_for_wildcard': (req, res)=>{
    return res.json({"fields":[{"name":"_id","type":"string","esTypes":["_id"],"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","esTypes":["_index"],"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","esTypes":["_source"],"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","esTypes":["_type"],"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"address","type":"string","esTypes":["text"],"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"address.keyword","type":"string","esTypes":["keyword"],"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"address"}}},{"name":"age","type":"conflict","esTypes":["text","long"],"searchable":true,"aggregatable":true,"readFromDocValues":false,"conflictDescriptions":{"text":["test-custom1"],"long":["test-custom","test-custom8","test-custom9"]}},{"name":"age.keyword","type":"string","esTypes":["keyword"],"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"age"}}},{"name":"created_at","type":"date","esTypes":["date"],"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"email","type":"string","esTypes":["text"],"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"email.keyword","type":"string","esTypes":["keyword"],"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"email"}}},{"name":"hobbies","type":"string","esTypes":["text"],"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"hobbies.keyword","type":"string","esTypes":["keyword"],"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"hobbies"}}},{"name":"id","type":"string","esTypes":["text"],"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"id.keyword","type":"string","esTypes":["keyword"],"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"id"}}},{"name":"name","type":"string","esTypes":["text"],"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"name.keyword","type":"string","esTypes":["keyword"],"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"name"}}}]}) 
  },
  'GET elasticsearch/:clusterID/setting/defaultIndex': (req, res)=>{
    return res.json('');
  }
}