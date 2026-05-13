import { SearchEngines } from "../search_engines"

type TransformOptions = {
  sourceDistribution: string,
  targetDistribution: string,
}

const pruneKeys = (target: any, keys: string[]) => {
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    return;
  }
  keys.forEach((key) => {
    delete target[key];
  });
}

const sanitizeElasticsearchPayload = (config: any) => {
  pruneKeys(config, ["version", "modified_date", "modified_date_string", "in_use_by", "_id", "_version", "_seq_no", "_primary_term"]);
  return config;
}

const sanitizeISMPayload = (config: any) => {
  if(!config || !config.policy){
    return {};
  }
  pruneKeys(config, ["version", "modified_date", "modified_date_string", "in_use_by", "_id", "_version", "_seq_no", "_primary_term", "policy_seq_no", "policy_primary_term"]);
  const policy = config.policy;
  pruneKeys(policy, ["policy_id", "last_updated_time", "created_time", "_meta"]);
  if(!policy["description"]){
    policy["description"] = "tranform with infini console";
  }
  if(!policy["default_state"]){
    policy["default_state"] = policy.states?.[0]?.name;
  }
  if(Array.isArray(policy["ism_template"])){
    policy["ism_template"] = policy["ism_template"]
      .filter((item: any) => item && typeof item === "object" && !Array.isArray(item))
      .map((item: any) => {
        const nextItem = { ...item };
        pruneKeys(nextItem, ["last_updated_time"]);
        nextItem.index_patterns = Array.isArray(nextItem.index_patterns)
          ? nextItem.index_patterns.filter((pattern: any) => typeof pattern === "string" && pattern.trim())
          : [];
        if(typeof nextItem.priority !== "number"){
          nextItem.priority = 100;
        }
        return nextItem;
      })
      .filter((item: any) => item.index_patterns.length > 0);
  } else if(policy["ism_template"] && typeof policy["ism_template"] === "object"){
    policy["ism_template"] = [policy["ism_template"]];
    return sanitizeISMPayload({ policy });
  } else {
    delete policy["ism_template"];
  }
  if(Array.isArray(policy["ism_template"]) && policy["ism_template"].length === 0){
    delete policy["ism_template"];
  }
  return {
    policy,
  };
}

export const transform = (config: any, options: TransformOptions) => {
  if(options.targetDistribution === SearchEngines.Opensearch){
    if(returnsInternalILMPolicy(options.sourceDistribution)){
      return normalizeISMPolicy(config);
    }
    return transformElasticsearchToISM(config);
  }
  if(returnsInternalILMPolicy(options.sourceDistribution)){
    return transformISMToElasticsearch(config);
  }
  
  return config
}

const returnsInternalILMPolicy = (distribution: string) => {
  return distribution === SearchEngines.Opensearch || distribution === SearchEngines.Easysearch;
}

const normalizeISMPolicy = (config: any) => {
  if(!config || !config.policy){
    return {};
  }
  const policy = config.policy;
  [{from: "last_updated_time", to: "modified_date"}, {from :"schema_version", to:"version"}].forEach(item=>{
    if(config[item.to]){
      policy[item.from] = config[item.to];
      delete config[item.to];
    }
  })
  return sanitizeISMPayload(config);
}

const transformElasticsearchToISM = (config: any) =>{
  if(!config || !config.policy){
    return {};
  }
  const policy = config.policy;
  if(policy["phases"]){
    policy["states"] = transformPhases(policy["phases"]);
    delete policy["phases"];
  }
  return normalizeISMPolicy(config);
}

const transformPhases = (phases: any)=>{
  const states: any[] = [];
  let nextTransition: any
  ["delete", "frozen", "cold", "warm", "hot"].forEach(pk=>{
    if(phases[pk]){
      const state :any = {
        "name": pk,
        "actions": [],
        "transitions": [],
      }
      Object.keys(phases[pk].actions).forEach(key => {
        //transform action key
        let tkey = key;
        if(key === "set_priority"){
          tkey = "index_priority";
        } else if(key === "allocate"){
          tkey = "allocation";
        } else if(key === "forcemerge"){
          tkey = "force_merge";
        } else if(key === "readonly"){
          tkey = "read_only";
        }
        //transform action value
        let tvalue = phases[pk].actions[key];
        if(tvalue && typeof tvalue === "object" && !Array.isArray(tvalue)){
          tvalue = { ...tvalue };
        }
        if(pk === "delete" && tvalue && typeof tvalue === "object"){
          delete tvalue["delete_searchable_snapshot"];
        }
        if(key === "rollover"){
          tvalue = transformRollover(tvalue, true)
        }
        state.actions.push({
          [tkey]: tvalue,
        })
      });
      if(nextTransition){
        state.transitions.push(nextTransition);
      }
      const minAge = parseInt(phases[pk].min_age);
      if(minAge > 0) {
        nextTransition = {
          "state_name": pk,
          "conditions": {
            "min_index_age": phases[pk].min_age,
          }
        }
      }else{
        nextTransition = null;
      }
     
      states.unshift(state);
    }
  });
  if(nextTransition && !phases["hot"]){
    states.unshift({
      "name": "hot",
      "transitions": [nextTransition],
    });
  }
  return states;
}

const transformISMToElasticsearch = (config: any)=>{
  if(!config || !config.policy){
    return {};
  }
  const policy = config.policy;
  //rename
  [{from: "last_updated_time", to: "modified_date"}, {from :"schema_version", to:"version"}].forEach(item=>{
    if(policy[item.from]){
      config[item.to] = policy[item.from]
    }
  })
  if(policy["states"]){
    policy["phases"] = transformStates(policy["states"]);
  }
  //clear fields
  for(let key of ["states", "schema_version", "default_state", "description", "error_notification", "ism_template", "last_updated_time", "policy_id"]){
    delete policy[key]
  }
  
  return sanitizeElasticsearchPayload(config);
}

const transformStates = (states: any[])=>{
  const phases = {};
  states.forEach((st)=>{
    const actions = {};
    (st.actions || []).forEach((action: any)=>{
      Object.keys(action || {}).forEach((ak)=>{
        if(ak === "retry" || ak === "timeout"){
          return;
        }
        let tkey = ak;
        let tvalue = action[ak];
        if(tvalue && typeof tvalue === "object" && !Array.isArray(tvalue)){
          tvalue = { ...tvalue };
        }
        if(tkey === "rollover"){
          tvalue = transformRollover(tvalue, false);
        }
        if(tkey === "index_priority"){
          tkey = "set_priority";
        } else if(tkey === "allocation"){
          tkey = "allocate";
          if(tvalue && typeof tvalue === "object"){
            delete tvalue.wait_for;
          }
        } else if(tkey === "force_merge"){
          tkey = "forcemerge";
        } else if(tkey === "read_only"){
          tkey = "readonly";
        }
        actions[tkey] = tvalue
      })
    })
    phases[st.name] = {
      actions
    }
  })
  states.forEach((st)=>{
    st.transitions?.forEach((tr: any)=>{
      phases[tr.state_name] = phases[tr.state_name] || {};
      phases[tr.state_name].min_age = tr.conditions?.min_index_age;
    })
  })
  return phases;
}

const transformRollover = (rolloverCfg: any, reverse: boolean) => {
  if(rolloverCfg && typeof rolloverCfg === "object" && !Array.isArray(rolloverCfg) && !reverse){
    delete rolloverCfg.copy_alias;
  }
  [{from: "min_size", to:"max_size"},{from:"min_primary_shard_size", to:"max_primary_shard_size"}, 
  {from: "min_doc_count", to:"max_docs"},{from: "min_index_age", to:"max_age"}].forEach((item)=>{
    if(reverse){
      if(rolloverCfg[item.to]){
        rolloverCfg[item.from] = rolloverCfg[item.to];
        delete rolloverCfg[item.to]
      }
    }else{
      if(rolloverCfg[item.from]){
        rolloverCfg[item.to] = rolloverCfg[item.from];
        delete rolloverCfg[item.from]
      }
    }
  });
  return rolloverCfg;
}
