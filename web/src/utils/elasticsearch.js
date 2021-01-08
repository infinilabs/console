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
    for(let fi in filterMappings[key].mappings.properties){
      fields.push(fi);
    }
  }

  return fields;
}
