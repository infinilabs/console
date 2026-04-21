import { InitIndices } from "./InitIndices";
import { ILMPolicy } from "./Init/ILMPolicy";
import {Template} from "./Init/Template";
import {Alias} from "./Init/Alias";
import {Container} from "./Init/Container";
import { Divider } from "antd";
import { useGlobalClusters } from "@/layouts/GlobalContext";
import { useMemo } from "react";
import { SearchEngines } from "@/lib/search_engines";

export const InitConfig = (props)=>{
  const { stepData } = props;
  const clustersM = useGlobalClusters();
  
  const isSupportILM = useMemo(()=>{
    const sourceVersion = clustersM[stepData.cluster.source.id]?.version;
    const targetVersion = clustersM[stepData.cluster.target.id]?.version;
    const sourceDistribution = clustersM[stepData.cluster.source.id]?.distribution;
    const targetDistribution = clustersM[stepData.cluster.target.id]?.distribution;
    return supportILM(sourceVersion, sourceDistribution) && supportILM(targetVersion, targetDistribution)
  }, [clustersM, stepData.cluster]);
  
  return <div>
    {/* <Divider orientation="left">ILM Policy</Divider> */}
    {isSupportILM? <Container title="ILM Policy" collapsed={false}>
     <ILMPolicy {...props}/>
    </Container>: null}
    <Container title="Template" collapsed={isSupportILM} >
      <Template {...props}/>
    </Container>
    <Container title="Index Settings">
      <InitIndices {...props}/>
    </Container>
    <Container title="Alias">
      <Alias {...props}/>
    </Container>
  </div>
}

const supportILM = (version = "", distribution=SearchEngines.Elasticsearch) => {
  if(distribution === SearchEngines.Easysearch){
    version = "7.10.2";
  }else if (distribution === SearchEngines.Opensearch){
    return true;
  }
  const [majorPart, minPart] = version.split(".");
  const major = parseInt(majorPart);
  const min = parseInt(minPart);
  if(major > 6){
    return true;
  }
  if(major === 6 && min >= 6) {
    return true
  }
  return false;
}