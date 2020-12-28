
function registerKeyProposals(key){
  let proposals = {
    'bool': [{
      label: 'filter',
      documentation: "filter",
      insertText: '"filter": [\n\t{}\n]',
    },{
      label: 'minimum_should_match',
      insertText: '"minimum_should_match": 1',
    },{
      label: 'must',
      insertText: '"must": [\n\t{}\n]',
    },{
      label: 'must_not',
      insertText: '"must_not": [\n\t{}\n]',
    },{
      label: 'should',
      insertText: '"should": [\n\t{}\n]',
    }],
    'multi_match':[{
      label: 'analyzer',
      insertText: '"analyzer": ""',
    },{
      label: 'boost',
      insertText: '"boost": 1',
    },{
      label: 'fuzziness',
      insertText: '"fuzziness": 1',
    },{
      label: 'minimum_should_match',
      insertText: '"minimum_should_match": 1',
    },{
      label: 'operator',
      insertText: '"operator": "and"',
    },{
      label: 'type',
      insertText: '"type": "best_fields"',
    }]
  };
  if(proposals[key]){
    return proposals[key];
  }else{
    return [];
  }
}

export function createDependencyProposals(key, range, mi) {
  if(['', 'must', 'must_not', 'should'].includes(key)){
    return queryProposals.map(p=>{
      return {
        kind: mi.languages.CompletionItemKind.Property,
        ...p,
        insertTextRules: mi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: range
      }
    })
  }
  return registerKeyProposals(key).map(p=>{
    return {
      kind: mi.languages.CompletionItemKind.Property,
      ...p,
      insertTextRules: mi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range
    }
  });

}
 
let queryProposals = [{
  label: 'bool',
  documentation: "bool query",
  insertText: '"bool": {}',
},{
  label: 'exists',
  documentation: "exists query",
  insertText: '"exists": {}',
},{
  label: 'fuzzy',
  documentation: "fuzzy query",
  insertText: '"fuzzy": {\n\t"${1:FIELD}": {}\n}',
  insertTextRules: 1,
},{
  label: 'match',
  documentation: "match query",
  insertText: '"match": {\n\t"${1:FIELD}": "${2:TEXT}"\n}',
  insertTextRules: 1,
},{
  label: 'match_all',
  documentation: "match_all query",
  insertText: '"match_all": {}',
  
},{
  label: 'match_phrase',
  documentation: "match_phrease query",
  insertText: '"match_phrase": {\n\t"${1:FIELD}": "${2:PHRASE}"\n}',
  insertTextRules: 1,
},{
  label: 'match_phrase_prefix',
  documentation: "match_phrease query",
  insertText: '"match_phrase_prefix": {\n\t"${1:FIELD}": "${2:PREFIX}"\n}',
  insertTextRules: 1,
},{
  label: 'multi_match',
  documentation: "multi_match query",
  insertText: '"multi_match": {\n\t"query": "${1:}",\n\t"fields": [${2:}]\n}',
  insertTextRules: 1,
},{
  label: 'nested',
  documentation: "nested query",
  insertText: '"nested": {\n\t"path": "${1:path_to_nested_doc}",\n\t"query": {}\n}',
  insertTextRules: 1,
},{
  label: 'prefix',
  documentation: "prefix query",
  insertText: '"prefix": {\n\t"${1:FIELD}": {\n\t\t"value": "${2:}"\n\t}\n}',
  insertTextRules: 1,
},{
  label: 'query_string',
  documentation: "query_string query",
  insertText: '"query_string": {\n\t"default_field": "${1:FIELD}",\n\t"query": "${2:this AND that OR thus}"\n}',
  insertTextRules: 1,
},{
  label: 'range',
  documentation: "range query",
  insertText: '"range": {\n\t"${1:FIELD}":{\n\t\t"gte": 0,\n\t\t"lte": 10\n\t}\n}',
  insertTextRules: 1,
},{
  label: 'regexp',
  documentation: "regexp query",
  insertText: '"regexp": {\n\t"${1:FIELD}": "${2:REGEXP}"\n}',
  insertTextRules: 1,
},{
  label: 'term',
  documentation: "term query",
  insertText: '"term": {\n\t"${1:FIELD}": {\n\t\t"value": "${2:}"\n\t}\n}',
  insertTextRules: 1,
},{
  label: 'terms',
  documentation: "terms query",
  insertText: '"terms": {\n\t"${1:FIELD}": [\n\t\t"VALUE1",\n\t\t"VALUE2"\n\t]\n}',
  insertTextRules: 1,
},]