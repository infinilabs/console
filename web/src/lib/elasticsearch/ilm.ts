import { SearchEngines } from "../search_engines"

type TransformOptions = {
  sourceDistribution: string,
  targetDistribution: string,
}

export const transform = (config: any, options: TransformOptions) => {
  if(options.sourceDistribution === SearchEngines.Opensearch){
    return transformOpensearchToElasticsearch(config);
  }
  if(options.targetDistribution === SearchEngines.Opensearch){
    return transformElasticsearchToOpensearch(config);
  }
  
  return config
}

const transformElasticsearchToOpensearch = (config: any) =>{
  if(!config || !config.policy){
    return {};
  }
  const policy = config.policy;
  //rename
  [{from: "last_updated_time", to: "modified_date"}, {from :"schema_version", to:"version"}].forEach(item=>{
    if(config[item.to]){
      policy[item.from] = config[item.to];
      delete config[item.to];
    }
  })
  if(policy["phases"]){
    policy["states"] = transformPhases(policy["phases"]);
    delete policy["phases"];
  }
  policy["description"] = "tranform with infini console";
  policy["default_state"] = policy.states[0]?.name;
  policy["ism_template"] = {
    "index_patterns": [],
    "priority": 100
  }
  return config;
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
        if(pk === "delete"){
          delete  phases[pk].actions[key]["delete_searchable_snapshot"];
        }
        //transform action key
        let tkey = key;
        if(key === "set_priority"){
          tkey = "index_priority";
        }
        //transform action value
        let tvalue = phases[pk].actions[key];
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

const transformOpensearchToElasticsearch = (config: any)=>{
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
  
  return config;
}

const transformStates = (states: any[])=>{
  const phases = {};
  states.forEach((st)=>{
    const actions = {};
    (st.actions || []).forEach((action: any)=>{
      const ak = Object.keys(action).shift();
      if(!ak) {
        return;
      }
      let tkey = ak;
      let tvalue = action[ak];
      if(tkey === "rollover"){
        tvalue = transformRollover(tvalue, false);
      }
      //transform key
      if(tkey === "index_priority"){
        tkey = "set_priority";
      }
      actions[tkey] = tvalue
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