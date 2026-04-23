import { Modal, Button, message, Icon} from "antd";
import { useRef, useState, useEffect, useCallback } from "react";
import request from "@/utils/request";
import { Tabs } from 'antd';
import { SettingsEditor } from "./SettingsEditor";
import { transform } from "@/lib/elasticsearch/mappings";
import { useGlobalClusters } from "@/layouts/GlobalContext";
import { SearchEngines } from "@/lib/search_engines";
import { formatMessage } from "umi/locale";
import { applyEasysearchMigrationIndexSettings } from "../utils/indexSettings";
const TabPane = Tabs.TabPane;

export default ({ record, setStepData, cluster }) => {
  const [state, setState] = useState({
    sourceIndexInfo: {}
  })
  useEffect(()=>{
    const getSourceIndexInfo = async ()=>{
      const indexName = record.source?.name;
      const sourceIndexInfo = await request(`/elasticsearch/${cluster.source.id}/index/${indexName}`);
      if(sourceIndexInfo && sourceIndexInfo[indexName]){
        const indexSettings = sourceIndexInfo[indexName].settings?.index || {};
        ["creation_date", "provided_name", "uuid", "version"].forEach((v)=>{
          delete indexSettings[v]
        });
        setState((st)=>{
          return {
            ...st,
            sourceIndexInfo: sourceIndexInfo[indexName],
          }
        })
      }
    } 
    getSourceIndexInfo();
  }, [record]);
  const clustersM = useGlobalClusters();
  const isEasysearchTarget =
    clustersM?.[cluster.target.id]?.distribution === SearchEngines.Easysearch;

  const onOptimizeMappingsClick = useCallback(()=>{
    setStepData((data)=>{
      const strMappings = record.targetIndexMappings;
      if(!strMappings || !strMappings.trim()){
        return data;
      }
      let mappings = {}
      try{
        mappings = JSON.parse(strMappings)
      }catch(err){
        console.error(err)
      }
      let sourceVersion = cluster.source.version;
      let targetVersion = cluster.target.version;
      //rewrite version for opensearch and easysearch
      if(clustersM[cluster.target.id].distribution === SearchEngines.Easysearch){
        targetVersion = "7.10.2";
      }else if(clustersM[cluster.target.id].distribution === SearchEngines.Opensearch){
        targetVersion = "8.0.0";
      }
      if(clustersM[cluster.source.id].distribution === SearchEngines.Easysearch){
        sourceVersion = "7.10.2";
      }else if(clustersM[cluster.source.id].distribution === SearchEngines.Opensearch){
        sourceVersion = "8.0.0";
      }
      mappings = transform(mappings, {
        sourceVersion,
        targetVersion,
        targetDocType: record.target.doc_type,
      });
      const idx = data.indices.findIndex(item=>item.target.name == record.target.name && item.target.doc_type == record.target.doc_type)
      if(idx > -1){
        data.indices[idx].targetIndexMappings = JSON.stringify(mappings, "", 2);
      }
      return {
        ...data,
        indices: [...data.indices],
      };
    })
  }, [record, cluster, clustersM])

  const onOptimizeSettingsClick = useCallback(()=>{
    setStepData((data)=>{
      const strSettings = record.targetIndexSettings;
      if(!strSettings || !strSettings.trim()){
        return data;
      }
      let settings = {}
      try{
        settings = JSON.parse(strSettings)
      }catch(err){
        console.error(err)
      }
      const indexSettings = settings.index || {};
      if(clustersM[cluster.source.id].distribution === SearchEngines.Elasticsearch && clustersM[cluster.target.id].distribution != SearchEngines.Elasticsearch){ 
        if(indexSettings.lifecycle){
          delete indexSettings["lifecycle"];
        }
      }
      settings.index = _.merge(indexSettings, {
        "number_of_replicas": 0,
        "refresh_interval": "-1",
        translog:{
          "durability": "async",
          "flush_threshold_size": "500mb"
        }
      });
      const idx = data.indices.findIndex(item=>item.target.name == record.target.name && item.target.doc_type == record.target.doc_type)
      if(idx > -1){
        data.indices[idx].targetIndexSettings = JSON.stringify(settings, "", 2)
      }
      return {
        ...data,
        indices: [...data.indices],
      };
    })
  },[record, cluster, clustersM]);

  const onAddEasysearchParamsClick = useCallback(() => {
    setStepData((data) => {
      let settings = {};
      try {
        settings = record.targetIndexSettings?.trim()
          ? JSON.parse(record.targetIndexSettings)
          : {};
      } catch (err) {
        console.error(err);
        message.warning(
          formatMessage({
            id: "migration.message.invalid_index_settings",
            defaultMessage:
              "Current target index settings are invalid JSON. Please fix them before adding migration parameters.",
          })
        );
        return data;
      }
      const idx = data.indices.findIndex(
        (item) =>
          item.target.name == record.target.name &&
          item.target.doc_type == record.target.doc_type
      );
      if (idx > -1) {
        data.indices[idx].targetIndexSettings = JSON.stringify(
          applyEasysearchMigrationIndexSettings(settings),
          "",
          2
        );
      }
      message.success(
        formatMessage({
          id: "migration.message.easysearch_params_added",
          defaultMessage:
            "Added compression and source reuse parameters to the target index settings.",
        })
      );
      return {
        ...data,
        indices: [...data.indices],
      };
    });
  }, [record, setStepData]);
  
  const mappings = getMappings(state.sourceIndexInfo.mappings, record.source.doc_type);
  
  return <div>
  <Tabs defaultActiveKey="1" animated={false}>
    <TabPane tab="Mappings" key="1">
      <EditorActionButtons
        actions={[
          {
            key: "optimize-mappings",
            icon: "thunderbolt",
            label: formatMessage({
              id: "migration.button.auto_optimize",
              defaultMessage: "Auto Optimize",
            }),
            onClick: onOptimizeMappingsClick,
          },
        ]}
      />
      <SettingsEditor onValueChange={(text)=>{
        setStepData((data)=>{
          const idx = data.indices.findIndex(item=>item.target.name == record.target.name && item.target.doc_type == record.target.doc_type)
          if(idx > -1){
            data.indices[idx].targetIndexMappings = text;
          }
          return {
            ...data,
            indices: [...data.indices],
          };
        })
      }} targetText={record.targetIndexMappings} sourceText={ mappings? JSON.stringify(mappings,"", 2): ""} />
    </TabPane>
    <TabPane tab="Settings" key="2">
      <EditorActionButtons
        actions={[
          ...(isEasysearchTarget
            ? [
                {
                  key: "easysearch-params",
                  icon: "plus-circle",
                  label: formatMessage({
                    id: "migration.button.add_easysearch_params",
                    defaultMessage: "Add Compression Params",
                  }),
                  onClick: onAddEasysearchParamsClick,
                },
              ]
            : []),
          {
            key: "optimize-settings",
            icon: "thunderbolt",
            label: formatMessage({
              id: "migration.button.auto_optimize",
              defaultMessage: "Auto Optimize",
            }),
            onClick: onOptimizeSettingsClick,
          },
        ]}
      />
      <SettingsEditor onValueChange={(text)=>{
        setStepData((data)=>{
          const idx = data.indices.findIndex(item=>item.target.name == record.target.name && item.target.doc_type == record.target.doc_type)
          if(idx > -1){
            data.indices[idx].targetIndexSettings = text;
          }
          return {
            ...data,
            indices: [...data.indices],
          };
        })
      }} targetText={record.targetIndexSettings} sourceText={state.sourceIndexInfo.settings ? JSON.stringify(state.sourceIndexInfo.settings,"", 2): ""} />
    </TabPane>
  </Tabs>
  </div>;
};

const EditorActionButtons = ({ actions = [] }) => {
  if (!actions.length) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        zIndex: 10,
        right: 24,
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {actions.map((action) => (
        <a key={action.key} onClick={action.onClick}>
          <Icon type={action.icon} /> {action.label}
        </a>
      ))}
    </div>
  );
};

const getMappings = (mappings = {}, docType)=>{
  if(mappings[docType]){
    return {
      [docType]: mappings[docType],
    }
  }
  return mappings; 
}
