export function getFields(index, mappings){
  if(!index){
    return [];
  }
  let filterMappings = {};
  if(index.indexOf("*")>0){
    index = index.replace("*", '');
    for(let key in mappings){
      if(key.startsWith(index)){
        filterMappings['key'] = mappings[key];
      }
    }
  }else{
    if(!mappings[index]){
      return [];
    }
    filterMappings[index] = mappings[index];
  }

  let fields = [];
  for(let key in filterMappings){
    if(filterMappings[key].mappings.properties) {
      for (let fi in filterMappings[key].mappings.properties) {
        fields.push(fi);
      }
    }else{
      Object.keys(filterMappings[key].mappings).forEach((typ)=>{
        for (let fi in filterMappings[key].mappings[typ].properties) {
          fields.indexOf(fi) === - 1 && fields.push(fi);
        }
      })
    }
  }

  return fields;
}

export function formatESSearchResult(esResp) {
  const total = esResp.hits.total
  if(total == null || total.value == 0){
    return {
      total: total,
      data: [],
    };
  }
  let dataArr = [];
  if(esResp.hits.hits) {
    for (let hit of esResp.hits.hits) {
      if (!hit._source.id) {
        hit._source["id"] = hit._id
      }
      hit._source["_index"] = hit._index
      if(hit["_type"]){
        hit._source["_type"] = hit["_type"]
      }
      dataArr.push(hit._source)
    }
  }
  return {
    total: total,
    data: dataArr,
  }
}

const ESAPIV0 = {
  getProperties(params){
    const {index, mappings} = params;
    if(typeof mappings[index] === 'undefined'){
      return {};
    }
    return mappings[index].mappings.properties;
  },
  extractIndicesFromMappings(mappings){
    if(!mappings){
      return [];
    }
    return Object.keys(mappings).map(index=>{return{
      index: index
    }});
  }
}

const ESAPIV2 = {
  ...ESAPIV0,
  getProperties(params){
    const {index, mappings, typ} = params;
    if(typeof mappings[index] === 'undefined'){
      return {};
    }
    let targetMappings = mappings[index].mappings;
    if(typeof targetMappings[typ] === 'undefined'){
      return {}
    }
    return targetMappings[typ].properties;
  },
  extractIndicesFromMappings(mappings){
    let indices = [];
    for(let index in mappings){
      indices.push({
        index: index,
        types: Object.keys(mappings[index].mappings).map(typ => { return typ})
      });
    }
    return indices;
  }
}


const ESAPIV5 = {
  ...ESAPIV2
}

const ESAPIV6 = {
  ...ESAPIV5,
  typeName: "_doc",
  getProperties(params){
    params.typ = this.typeName;
    return ESAPIV5.getProperties(params);
  }
}

const ESAPI = {
  "0": ESAPIV0,
  "2": ESAPIV2,
  "5": ESAPIV5,
  "6": ESAPIV6,
}

export function getESAPI(ver){
  if(typeof ESAPI[ver] != "undefined"){
    return ESAPI[ver];
  }
  return ESAPI["0"];
}