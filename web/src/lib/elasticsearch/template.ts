import { SearchEngines } from "../search_engines";

type TransformOptions = {
  sourceVersion: string,
  targetVersion: string,
  sourceDistribution: string,
  targetDistribution: string
}

export const transform = (tpl: any, options: TransformOptions) => {
  if(!tpl){
    return {}
  }
  const targetMajorStr = options.targetVersion.split(".")[0];
  const targetMajor = parseInt(targetMajorStr)
  const sourceMajorStr = options.sourceVersion.split(".")[0];
  const sourceMajor = parseInt(sourceMajorStr)
  switch(true){
    case targetMajor < 6 && sourceMajor >= 6:
      // index_patterns => template
      if(tpl["index_patterns"]){
        tpl["template"] = tpl["index_patterns"];
        delete tpl["index_patterns"];
      }
      break
    case targetMajor >= 6 && sourceMajor < 6:
      // template => index_patterns 
      if(tpl["template"]){
        tpl["index_patterns"] = tpl["template"];
        delete tpl["template"];
      }
  }
  if(options.sourceDistribution !== SearchEngines.Opensearch && options.targetDistribution === SearchEngines.Opensearch){
    tpl = transformElasticsearchTemplateLifecycleToISM(tpl);
  } else if(options.sourceDistribution === SearchEngines.Opensearch && options.targetDistribution !== SearchEngines.Opensearch){
    tpl = transformISMTemplateLifecycleToElasticsearch(tpl);
  }
  return tpl;
}

const ensureIndexSettings = (tpl: any) => {
  tpl.settings = tpl.settings || {};
  tpl.settings.index = tpl.settings.index || {};
  return tpl.settings.index;
}

const readElasticsearchLifecycleSetting = (settings: any, key: string) => {
  if(!settings){
    return;
  }
  const flatValue = settings[`index.lifecycle.${key}`];
  if(flatValue !== undefined){
    return flatValue;
  }
  const indexSettings = settings.index || {};
  const nestedValue = indexSettings?.lifecycle?.[key];
  if(nestedValue !== undefined){
    return nestedValue;
  }
  return indexSettings?.[`lifecycle.${key}`];
}

const readISMSetting = (settings: any, key: string) => {
  if(!settings){
    return;
  }
  for(const prefix of [
    "plugins.index_state_management",
    "opendistro.index_state_management",
  ]){
    const flatValue = settings[`index.${prefix}.${key}`];
    if(flatValue !== undefined){
      return flatValue;
    }
  }
  const indexSettings = settings.index || {};
  for(const prefix of [
    "plugins.index_state_management",
    "opendistro.index_state_management",
  ]){
    const prefixedValue = indexSettings?.[`${prefix}.${key}`];
    if(prefixedValue !== undefined){
      return prefixedValue;
    }
  }
  for(const namespace of ["plugins", "opendistro"]){
    const nestedValue = indexSettings?.[namespace]?.index_state_management?.[key];
    if(nestedValue !== undefined){
      return nestedValue;
    }
  }
}

const deleteElasticsearchLifecycleSettings = (settings: any) => {
  if(!settings){
    return;
  }
  delete settings["index.lifecycle.name"];
  delete settings["index.lifecycle.rollover_alias"];
  const indexSettings = settings.index || {};
  delete indexSettings["lifecycle.name"];
  delete indexSettings["lifecycle.rollover_alias"];
  if(indexSettings.lifecycle){
    delete indexSettings.lifecycle.name;
    delete indexSettings.lifecycle.rollover_alias;
    if(Object.keys(indexSettings.lifecycle).length === 0){
      delete indexSettings.lifecycle;
    }
  }
}

const deleteISMSettings = (settings: any) => {
  if(!settings){
    return;
  }
  for(const prefix of [
    "plugins.index_state_management",
    "opendistro.index_state_management",
  ]){
    delete settings[`index.${prefix}.policy_id`];
    delete settings[`index.${prefix}.rollover_alias`];
  }
  const indexSettings = settings.index || {};
  for(const prefix of [
    "plugins.index_state_management",
    "opendistro.index_state_management",
  ]){
    delete indexSettings[`${prefix}.policy_id`];
    delete indexSettings[`${prefix}.rollover_alias`];
  }
  for(const namespace of ["plugins", "opendistro"]){
    if(!indexSettings?.[namespace]?.index_state_management){
      continue;
    }
    delete indexSettings[namespace].index_state_management.policy_id;
    delete indexSettings[namespace].index_state_management.rollover_alias;
    if(Object.keys(indexSettings[namespace].index_state_management).length === 0){
      delete indexSettings[namespace].index_state_management;
    }
    if(Object.keys(indexSettings[namespace]).length === 0){
      delete indexSettings[namespace];
    }
  }
}

const transformElasticsearchTemplateLifecycleToISM = (tpl: any) => {
  const settings = tpl.settings;
  if(!settings){
    return tpl;
  }
  let policyID = readElasticsearchLifecycleSetting(settings, "name");
  let rolloverAlias = readElasticsearchLifecycleSetting(settings, "rollover_alias");
  if(policyID === undefined && rolloverAlias === undefined){
    policyID = readISMSetting(settings, "policy_id");
    rolloverAlias = readISMSetting(settings, "rollover_alias");
    if(policyID === undefined && rolloverAlias === undefined){
      return tpl;
    }
  }
  deleteElasticsearchLifecycleSettings(settings);
  deleteISMSettings(settings);
  const indexSettings = ensureIndexSettings(tpl);
  if(policyID !== undefined){
    indexSettings["plugins.index_state_management.policy_id"] = policyID;
  }
  if(rolloverAlias !== undefined){
    indexSettings["plugins.index_state_management.rollover_alias"] = rolloverAlias;
  }
  return tpl;
}

const transformISMTemplateLifecycleToElasticsearch = (tpl: any) => {
  const settings = tpl.settings;
  if(!settings){
    return tpl;
  }
  const policyID = readISMSetting(settings, "policy_id");
  const rolloverAlias = readISMSetting(settings, "rollover_alias");
  deleteISMSettings(settings);
  if(policyID === undefined && rolloverAlias === undefined){
    return tpl;
  }
  const indexSettings = ensureIndexSettings(tpl);
  indexSettings.lifecycle = indexSettings.lifecycle || {};
  if(policyID !== undefined){
    indexSettings.lifecycle.name = policyID;
  }
  if(rolloverAlias !== undefined){
    indexSettings.lifecycle.rollover_alias = rolloverAlias;
  }
  return tpl;
}
