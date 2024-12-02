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

import { get, map } from 'lodash';

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import fetch from 'node-fetch';

const searchRes = {"took":4,"timed_out":false,"_shards":{"total":4,"successful":4,"skipped":0,"failed":0},"hits":{"total":{"value":36,"relation":"eq"},"max_score":null,"hits":[{"_index":"test-custom","_type":"_doc","_id":"bvskmkdath26jg58o8b0","_score":null,"_source":{"ceshi":{"name":"test"},"address":"长沙","age":31,"created_at":"2021-01-26T09:21:54.164Z","email":"786027438@qq.com","hobbies":["test3"],"name":"liugq"},"sort":[1611652914164]},{"_index":"test-custom","_type":"_doc","_id":"bvhlsptath2d6oa9044g","_score":null,"_source":{"address":"hunan changsha","age":33,"created_at":"2021-01-26T09:17:21.853Z","email":"786027438@qq.com","hobbies":["test"],"id":"bvhlsptath2d6oa9044g","name":"hellodd"},"sort":[1611652641853]},{"_index":"test-custom9","_type":"_doc","_id":"c07ta45ath23a5g2k5cg","_score":null,"_source":{"address":"长沙","age":32,"created_at":"2021-01-26T06:20:51.918Z","email":"786027438@qq.com","hobbies":["testx"],"name":"liugq"},"sort":[1611642051918]},{"_index":"test-custom8","_type":"_doc","_id":"bvi5ellath2e0ukbq5e0","_score":null,"_source":{"address":"湖北武汉2","age":46,"created_at":"2021-01-25T14:08:07.129Z","email":"786027438@qq.com","hobbies":["test3"],"id":"bvi5ellath2e0ukbq5e0","name":"武汉test"},"sort":[1611583687129]},{"_index":"test-custom9","_type":"_doc","_id":"bvskmkdath26jg58o8b0","_score":null,"_source":{"address":"长沙","age":32,"created_at":"2021-01-09T06:20:51.918Z","email":"786027438@qq.com","hobbies":["test3"],"name":"liugq"},"sort":[1610173251918]},{"_index":"test-custom8","_type":"_doc","_id":"bvskmkdath26jg58o8b0","_score":null,"_source":{"address":"长沙","age":32,"created_at":"2021-01-09T06:20:51.918Z","email":"786027438@qq.com","hobbies":["test3"],"name":"liugq"},"sort":[1610173251918]},{"_index":"test-custom1","_type":"_doc","_id":"bvljlhlath20ju108ha0","_score":null,"_source":{"address":"jinsangyuan","created_at":"2020-12-29T14:18:40.425Z","email":"786027438@qq.com","hobbies":["test39"],"id":"bvljlhlath20ju108ha0","name":"铁路测试词典1"},"sort":[1609251520425]},{"_index":"test-custom9","_type":"_doc","_id":"bvhlsptath2d6oa9044g","_score":null,"_source":{"address":"hunan changsha","age":34,"created_at":"2020-12-29T08:24:49.715Z","email":"786027438@qq.com","hobbies":["test"],"id":"bvhlsptath2d6oa9044g","name":"hellodd"},"sort":[1609230289715]},{"_index":"test-custom","_type":"_doc","_id":"c07si0lath23a5g2k5ag","_score":null,"_source":{"address":"test addr","age":31,"created_at":"2020-12-26T03:57:57.620Z","email":"test@qq.com","hobbies":["h2"],"name":"test name"},"sort":[1608955077620]},{"_index":"test-custom","_type":"_doc","_id":"js7EjXYBKoaaPbVfvf-c","_score":null,"_source":{"address":"hunan zhuzhou","age":32,"created_at":"2020-12-23T03:59:57.620Z","email":"cincky@qq.com","hobbies":["basketball","badminton1"],"id":"js7EjXYBKoaaPbVfvf-c","name":"cincky"},"sort":[1608695997620]},{"_index":"test-custom9","_type":"_doc","_id":"js7EjXYBKoaaPbVfvf-c","_score":null,"_source":{"address":"hunan zhuzhou","age":32,"created_at":"2020-12-23T03:59:57.620Z","email":"cincky@qq.com","hobbies":["basketball","badminton1"],"id":"js7EjXYBKoaaPbVfvf-c","name":"cincky"},"sort":[1608695997620]},{"_index":"test-custom","_type":"_doc","_id":"bvia4ctath2eneoeeijg","_score":null,"_source":{"address":"beijing","age":32,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["basketball1","badminton"],"id":"bvia4ctath2eneoeeijg","name":"北京"},"sort":[1608695877620]},{"_index":"test-custom","_type":"_doc","_id":"bvi5omtath2e0ukbq5eg","_score":null,"_source":{"address":"湖北武汉","age":32,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test4"],"id":"bvi5omtath2e0ukbq5eg","name":"武汉2"},"sort":[1608695877620]},{"_index":"test-custom","_type":"_doc","_id":"bvia41lath2eneoeeij0","_score":null,"_source":{"address":"hunan changsha","age":45,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test3"],"name":"铁路测试词典"},"sort":[1608695877620]},{"_index":"test-custom","_type":"_doc","_id":"bvhltpdath2d6oa90450","_score":null,"_source":{"address":"hunan changsha","age":33,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test1"],"name":"liugqy"},"sort":[1608695877620]},{"_index":"test-custom","_type":"_doc","_id":"bvhm18dath2d6oa9046g","_score":null,"_source":{"address":"hunan changsha","age":31,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test5"],"name":"hello4"},"sort":[1608695877620]},{"_index":"test-custom","_type":"_doc","_id":"bvi5ellath2e0ukbq5e0","_score":null,"_source":{"address":"湖北武汉2","age":44,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test3"],"id":"bvi5ellath2e0ukbq5e0","name":"武汉test"},"sort":[1608695877620]},{"_index":"test-custom","_type":"_doc","_id":"bvhlv6dath2d6oa9045g","_score":null,"_source":{"address":"hunan changsha","age":45,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test2"],"name":"test 词典"},"sort":[1608695877620]},{"_index":"test-custom","_type":"_doc","_id":"jc6_jXYBKoaaPbVfj_8W","_score":null,"_source":{"address":"hunan changsha","age":32,"created_at":"2020-12-23T03:57:57.620Z","email":"liugq@qq.com","hobbies":["basketball","pingpan"],"id":"jc6_jXYBKoaaPbVfj_8W","name":"liugq国家"},"sort":[1608695877620]},{"_index":"test-custom","_type":"_doc","_id":"bvhm0d5ath2d6oa90460","_score":null,"_source":{"address":"hunan changsha1","age":30,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test3"],"id":"bvhm0d5ath2d6oa90460","name":"hello2"},"sort":[1608695877620]},{"_index":"test-custom9","_type":"_doc","_id":"bvhlv6dath2d6oa9045g","_score":null,"_source":{"address":"hunan changsha","created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":"[\"test2\"]","name":"test 词典"},"sort":[1608695877620]},{"_index":"test-custom9","_type":"_doc","_id":"bvhm0d5ath2d6oa90460","_score":null,"_source":{"address":"hunan changsha1","age":30,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test3"],"id":"bvhm0d5ath2d6oa90460","name":"hello2"},"sort":[1608695877620]},{"_index":"test-custom9","_type":"_doc","_id":"bvia4ctath2eneoeeijg","_score":null,"_source":{"address":"beijing","age":31,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["basketball1","badminton"],"id":"bvia4ctath2eneoeeijg","name":"北京"},"sort":[1608695877620]},{"_index":"test-custom9","_type":"_doc","_id":"bvhltpdath2d6oa90450","_score":null,"_source":{"address":"hunan changsha","created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test1"],"name":"liugqy"},"sort":[1608695877620]},{"_index":"test-custom9","_type":"_doc","_id":"bvhm18dath2d6oa9046g","_score":null,"_source":{"address":"hunan changsha","age":3,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test5"],"name":"hello4"},"sort":[1608695877620]},{"_index":"test-custom8","_type":"_doc","_id":"jc6_jXYBKoaaPbVfj_8W","_score":null,"_source":{"address":"hunan changsha","created_at":"2020-12-23T03:57:57.620Z","email":"liugq@qq.com","hobbies":"[\"basketball\",\"pingpan\"]","id":"jc6_jXYBKoaaPbVfj_8W","name":"liugq国家"},"sort":[1608695877620]},{"_index":"test-custom8","_type":"_doc","_id":"bvhm18dath2d6oa9046g","_score":null,"_source":{"address":"hunan changsha","created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":"[\"test5\"]","name":"hello4"},"sort":[1608695877620]},{"_index":"test-custom8","_type":"_doc","_id":"bvhlv6dath2d6oa9045g","_score":null,"_source":{"address":"hunan changsha","created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":"[\"test2\"]","name":"test 词典"},"sort":[1608695877620]},{"_index":"test-custom8","_type":"_doc","_id":"bvia4ctath2eneoeeijg","_score":null,"_source":{"address":"beijing","age":31,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["basketball1","badminton"],"id":"bvia4ctath2eneoeeijg","name":"北京"},"sort":[1608695877620]},{"_index":"test-custom8","_type":"_doc","_id":"bvi5omtath2e0ukbq5eg","_score":null,"_source":{"address":"湖北武汉","age":33,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test4"],"id":"bvi5omtath2e0ukbq5eg","name":"武汉2"},"sort":[1608695877620]},{"_index":"test-custom8","_type":"_doc","_id":"bvia41lath2eneoeeij0","_score":null,"_source":{"address":"hunan changsha","age":32,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test3"],"name":"铁路测试词典"},"sort":[1608695877620]},{"_index":"test-custom8","_type":"_doc","_id":"bvhm0d5ath2d6oa90460","_score":null,"_source":{"address":"hunan changsha1","age":30,"created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test3"],"id":"bvhm0d5ath2d6oa90460","name":"hello2"},"sort":[1608695877620]},{"_index":"test-custom8","_type":"_doc","_id":"bvhltpdath2d6oa90450","_score":null,"_source":{"address":"hunan changsha","created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test1"],"name":"liugqy"},"sort":[1608695877620]},{"_index":"test-custom1","_type":"_doc","_id":"vs7emHYBKoaaPbVfiv9c","_score":null,"_source":{"address":"beijing","created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["basketball1","badminton"],"name":"北京"},"sort":[1608695877620]},{"_index":"test-custom1","_type":"_doc","_id":"ckG-23YBihCx5kn1w_Pr","_score":null,"_source":{"address":"beijing","created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["basketball1","badminton"],"name":"北京"},"sort":[1608695877620]},{"_index":"test-custom1","_type":"_doc","_id":"bviuj5dath2fso8evhhg","_score":null,"_source":{"address":"hunan changsha","age":"32","created_at":"2020-12-23T03:57:57.620Z","email":"786027438@qq.com","hobbies":["test9"],"name":"index pattern1"},"sort":[1608695877620]}]},"aggregations":{"2":{"buckets":[{"key_as_string":"2020-12-21T00:00:00.000+08:00","key":1608480000000,"doc_count":28},{"key_as_string":"2020-12-28T00:00:00.000+08:00","key":1609084800000,"doc_count":2},{"key_as_string":"2021-01-04T00:00:00.000+08:00","key":1609689600000,"doc_count":2},{"key_as_string":"2021-01-25T00:00:00.000+08:00","key":1611504000000,"doc_count":4}]}}}

const getValueSuggestions = async (req, res)=> {
     // path: '/api/kibana/suggestions/values/{index}',
     return res.json(["hunan changsha","beijing","长沙","hunan changsha1","hunan zhuzhou","湖北武汉","湖北武汉2","jinsangyuan","test addr"]);
    
      const { field: fieldName, query, filters } = req.body;
      const { index } = req.params;

      const indexPattern = await findIndexPatternById(index);
      const field = indexPattern && getFieldByName(fieldName, indexPattern);
      const body = await getBody(field || fieldName, query || '', filters);
      console.log(field, fieldName);

      try {
        const result = await fetch(`http://localhost:9200/${index}/_search`,{
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify(body),
        }).then(fres=>{
          return fres.json();
        })

        const buckets =
          get(result, 'aggregations.suggestions.buckets') ||
          get(result, 'aggregations.nestedSuggestions.suggestions.buckets');

        return res.json(map(buckets || [], 'key'));
      } catch (error) {
        return res.json({ body: error });
      }
}

export default {
  'POST /elasticsearch/:id/suggestions/values/:index': getValueSuggestions,
  'POST /elasticsearch/:id/search/ese': async (req, res) => {
    const { index, body } = req.body;
    // const result = await fetch(`http://localhost:9200/${index}/_search`,{
    //   method: 'POST',
    //   headers: {
    //     'content-type': 'application/json'
    //   },
    //   body: JSON.stringify(body),
    // }).then(fres=>{
    //   return fres.json();
    // })
    res.json(searchRes)
  }
}

async function getBody(
  field,
  query,
  filters,
) {
  const isFieldObject = f => Boolean(f && f.name);

  // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-regexp-query.html#_standard_operators
  const getEscapedQuery = (q) =>
    q.replace(/[.?+*|{}[\]()"\\#@&<>~]/g, (match) => `\\${match}`);

  // Helps ensure that the regex is not evaluated eagerly against the terms dictionary
  const executionHint = 'map';

  // We don't care about the accuracy of the counts, just the content of the terms, so this reduces
  // the amount of information that needs to be transmitted to the coordinating node
  const shardSize = 10;
  const body = {
    size: 0,
    // timeout,
    // terminate_after,
    query: {
      bool: {
        filter: filters,
      },
    },
    aggs: {
      suggestions: {
        terms: {
          field: isFieldObject(field) ? field.name : field,
          include: `${getEscapedQuery(query)}.*`,
          execution_hint: executionHint,
          shard_size: shardSize,
        },
      },
    },
  };

  if (isFieldObject(field) && field.subType && field.subType.nested) {
    return {
      ...body,
      aggs: {
        nestedSuggestions: {
          nested: {
            path: field.subType.nested.path,
          },
          aggs: body.aggs,
        },
      },
    };
  }

  return body;
}
const getFieldByName = (
  fieldName,
  indexPattern
) => {
  const fields = indexPattern && JSON.parse(indexPattern.fields);
  const field = fields && fields.find((f) => f.name === fieldName);

  return field;
};

const findIndexPatternById = async (
  index
) => {
  const queryBody = `{
    "_source": ["index-pattern.fields"], 
    "query": {
      "bool": {
        "must": [
          {
           "match": {
              "type": "index-pattern"
            }
          },
          {
           "match": {
             "index-pattern.title": "${index}"
           }
          }
        ]
      }
    }
  }`
  const savedObjectsResponse = await fetch('http://localhost:9200/.kibana/_search', {
    body: queryBody,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    }
  }).then((res)=>{
    return res.json();
  });

  if (savedObjectsResponse.hits.total.value > 0) {
    const hit = savedObjectsResponse.hits.hits[0];
    return hit['_source']['index-pattern'];
  }
};

