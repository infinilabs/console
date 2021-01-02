export const queryData = {
  "errmsg": "",
  "errno": "0",
  "payload": {
    "data": [
      {
        "_index": "infini-test",
        "address": "hunan changsha",
        "created_at": "2020-12-23T03:57:57.620Z",
        "email": "liugq@qq.com",
        "hobbies": "[\"basketball\",\"pingpan\"]",
        "id": "jc6_jXYBKoaaPbVfj_8W",
        "name": "liugq国家"
      },
      {
        "_index": "infini-test",
        "address": "hunan changsha",
        "created_at": "2020-12-23T03:57:57.620Z",
        "email": "786027438@qq.com",
        "hobbies": "[\"test5\"]",
        "id": "bvhm18dath2d6oa9046g",
        "name": "hello4"
      },
      {
        "_index": "infini-test",
        "address": "hunan changsha",
        "created_at": "2020-12-23T03:57:57.620Z",
        "email": "786027438@qq.com",
        "hobbies": "[\"test2\"]",
        "id": "bvhlv6dath2d6oa9045g",
        "name": "test 词典"
      },
      {
        "_index": "infini-test",
        "address": "hunan changsha",
        "created_at": "2020-12-23T03:57:57.620Z",
        "email": "786027438@qq.com",
        "hobbies": "[\"test1\"]",
        "id": "bvhltpdath2d6oa90450",
        "name": "liugqy"
      },
      {
        "_index": "infini-test",
        "address": "hunan zhuzhou",
        "created_at": "2020-12-23T03:59:57.620Z",
        "email": "cincky@qq.com",
        "hobbies": "[\"basketball\",\"badminton1\"]",
        "id": "js7EjXYBKoaaPbVfvf-c",
        "name": "cincky"
      },
      {
        "_index": "infini-test",
        "address": "湖北武汉2",
        "created_at": "2020-12-23T03:57:57.620Z",
        "email": "786027438@qq.com",
        "hobbies": [
          "test3"
        ],
        "id": "bvi5ellath2e0ukbq5e0",
        "name": "武汉test"
      },
      {
        "_index": "infini-test",
        "address": "hunan changsha",
        "created_at": "2020-12-23T03:57:57.620Z",
        "email": "786027438@qq.com",
        "hobbies": [
          "test3"
        ],
        "id": "bvia41lath2eneoeeij0",
        "name": "铁路测试词典"
      },
      {
        "_index": "infini-test",
        "address": "beijing",
        "created_at": "2020-12-23T03:57:57.620Z",
        "email": "786027438@qq.com",
        "hobbies": [
          "basketball1",
          "badminton"
        ],
        "id": "bvia4ctath2eneoeeijg",
        "name": "北京"
      },
      {
        "_index": "infini-test",
        "address": "湖北武汉",
        "created_at": "2020-12-23T03:57:57.620Z",
        "email": "786027438@qq.com",
        "hobbies": [
          "test4"
        ],
        "id": "bvi5omtath2e0ukbq5eg",
        "name": "武汉2"
      },
      {
        "_index": "infini-test",
        "address": "hunan changsha1",
        "created_at": "2020-12-23T03:57:57.620Z",
        "email": "786027438@qq.com",
        "hobbies": [
          "test3"
        ],
        "id": "bvhm0d5ath2d6oa90460",
        "name": "hello2"
      }
    ],
    "mappings": {
      "infini-test": {
        "mappings": {
          "dynamic_templates": [
            {
              "strings": {
                "mapping": {
                  "ignore_above": 256,
                  "type": "keyword"
                },
                "match_mapping_type": "string"
              }
            }
          ],
          "properties": {
            "address": {
              "fields": {
                "keyword": {
                  "ignore_above": 256,
                  "type": "keyword"
                }
              },
              "type": "text"
            },
            "age": {
              "type": "integer"
            },
            "created_at": {
              "type": "date"
            },
            "email": {
              "type": "keyword"
            },
            "hobbies": {
              "type": "text"
            },
            "id": {
              "ignore_above": 256,
              "type": "keyword"
            },
            "name": {
              "type": "text"
            }
          }
        }
      }
    },
    "total": {
      "relation": "eq",
      "value": 11
    }
  }
}