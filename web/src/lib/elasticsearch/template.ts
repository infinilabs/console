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
  const flatValue = settings[`index.plugins.index_state_management.${key}`];
  if(flatValue !== undefined){
    return flatValue;
  }
  const indexSettings = settings.index || {};
  return indexSettings?.[`plugins.index_state_management.${key}`];
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
  delete settings["index.plugins.index_state_management.policy_id"];
  delete settings["index.plugins.index_state_management.rollover_alias"];
  const indexSettings = settings.index || {};
  delete indexSettings["plugins.index_state_management.policy_id"];
  delete indexSettings["plugins.index_state_management.rollover_alias"];
}

const transformElasticsearchTemplateLifecycleToISM = (tpl: any) => {
  const settings = tpl.settings;
  if(!settings){
    return tpl;
  }
  const policyID = readElasticsearchLifecycleSetting(settings, "name");
  const rolloverAlias = readElasticsearchLifecycleSetting(settings, "rollover_alias");
  deleteElasticsearchLifecycleSettings(settings);
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
