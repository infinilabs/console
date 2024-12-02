import _ from 'lodash';

type TransformOptions = {
  sourceVersion: string,
  targetVersion: string,
  targetDocType: string,
}

export const transform = (mappings: any, options: TransformOptions) => {
  if(!mappings){
    return {}
  }
  const targetMajorStr = options.targetVersion.split(".")[0];
  const targetMajor = parseInt(targetMajorStr)
  const sourceMajorStr = options.sourceVersion.split(".")[0];
  const sourceMajor = parseInt(sourceMajorStr)
  let targetProperties = {};
  let targetRest = {};
  const mkeys = Object.keys(mappings);
  if(mappings.properties || sourceMajor >=7 ){
    const {properties={}, ...rest} = mappings;
    targetProperties = properties;
    targetRest = rest;
  }else if(mkeys.length === 1){
    const {properties={}, ...rest} = mappings[mkeys[0]];
    if(options.targetDocType == ""){
      options.targetDocType = mkeys[0];
    }
    targetProperties = properties;
    targetRest = rest;
  }else{
    return {}
  }
  switch(true){
    case targetMajor < 5 && sourceMajor >= 5:
      //handle string type
      targetProperties = downgradeStringField(targetProperties);
      break
    case targetMajor >= 5 && sourceMajor < 5:
      targetProperties = upgradeStringField(targetProperties);
  }
  if(targetMajor >= 8 || (targetMajor >= 7 && (!options.targetDocType || options.targetDocType == "_doc"))){
    if(Object.keys(targetProperties).length > 0){
      return {
        ...targetRest,
        "properties": targetProperties,
      };
    }
    return {
      ...targetRest,
    }
  }
  if(Object.keys(targetProperties).length > 0){
    //template mappings when properties is empty
    return {
      [options.targetDocType || "doc"]: {
        ...targetRest,
        "properties": targetProperties,
      },
    }
  }
  return {
    [options.targetDocType || "doc"]: {
      ...targetRest,
    },
  }
 
}

const upgradeStringField = (properties: any)=>{
  Object.keys(properties).forEach(key=>{
    if(properties[key].type === "string"){
      properties[key].type = "keyword"; 
    }else{
      if(_.isObject(properties[key].properties)){
        properties[key] = {
          "properties": upgradeStringField(properties[key].properties),
        }; 
        return
      }
    }
  })
  return properties;
}

const downgradeStringField = (properties: any)=>{
  Object.keys(properties).forEach(key=>{
    if(["text", "keyword"].includes(properties[key].type)){
      properties[key].type = "string"; 
      const fields = properties[key].fields;
      if(fields){
        const fkeys = Object.keys(fields);
        if(fkeys.length > 0 && _.isObject(fields[fkeys[0]])){
          if(["text", "keyword"].includes(fields[fkeys[0]].type)){
            delete properties[key].fields;
          }
        }
      }
    }else{
      if(_.isObject(properties[key].properties)){
        properties[key] = {
          properties: downgradeStringField(properties[key].properties),
        } 
        return
      }
    }
  })
  return properties;
}
