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
  if(options.sourceDistribution != SearchEngines.Opensearch && options.targetDistribution === SearchEngines.Opensearch){
    if(tpl.settings?.index?.lifecycle){
      tpl.settings.index["plugins.index_state_management.rollover_alias"] = tpl.settings.index.lifecycle.rollover_alias;
      delete tpl.settings.index["lifecycle"];
    }
  }
  return tpl;
}