import React from "react";
import Overview from "./overview";
import Advanced from "./advanced";
import Shards from "./shards";
import { formatMessage } from "umi/locale";
import Monitor from "@/components/Overview/Monitor";
import StatisticBar from "./statistic_bar";
import ShardStatisticBar from "./shard_statistic_bar";
import { connect } from "dva";

const Page = (props) => {
  const { clusterStatus, clusterList, selectedCluster } = props;
  const {shard_id} = props.location.query;
  const panes = React.useMemo(()=>{
    const panes = [
      { title: "Overview", component: Overview, key: "overview" },
      { title: "Advanced", component: Advanced, key: "advanced" },
    ];
    
    if(!shard_id){
      panes.push({ title: "Shards", component: Shards, key: "shards" })
    }
    return panes
  }, [shard_id])
  let Bar = StatisticBar;
  if(shard_id){
    Bar = ShardStatisticBar;
  }
  return (
    <Monitor
      selectedCluster={props.match.params?.cluster_id === selectedCluster?.id ? selectedCluster : clusterList.find((item) => item.id === props.match.params?.cluster_id)}
      formatState={(state) => {
        return {
          ...state,
          clusterID: props.match.params?.cluster_id || "",
          clusterName: state?.param?.cluster_name || "",
          indexName: props.match.params?.index_name || "",
        };
      }}
      getBreadcrumbList={(state) => {
        const bl = [
        {
          title: formatMessage({ id: "menu.home" }),
          href: "/",
        },
        {
          title: formatMessage({ id: "menu.cluster" }),
        },
        {
          title: state.clusterName || state.clusterID,
          href: `/#/cluster/monitor/elasticsearch/${
            state.clusterID
          }?_g={"timeRange":${encodeURIComponent(JSON.stringify(state.timeRange))}}`,
        },
        {
          title: "Indices",
          href: `/#/cluster/monitor/elasticsearch/${
            state.clusterID
          }?_g={"tab":"indices","timeRange":${encodeURIComponent(JSON.stringify(
            state.timeRange
          ))}}`,
        },
        {
          title: state.indexName,
        },
        ];
        if(shard_id){
          bl[4].href = `/#/cluster/monitor/${state.clusterID}/indices/${state.indexName}?_g={"timeRange":${encodeURIComponent(JSON.stringify(state.timeRange))}}`
          bl.push({
            title: "Shards",
            href: `/#/cluster/monitor/${state.clusterID}/indices/${state.indexName}?_g={"timeRange":${encodeURIComponent(JSON.stringify(state.timeRange))},"tab":"shards"}`
          });
          bl.push({
            title: shard_id,
          });
        }
        return bl;
      }}
      StatisticBar={Bar}
      panes={panes}
      checkPaneParams={(params) => !!params.clusterID && !!params.indexName}
      extraParams={{shardID: shard_id}}
    />
  );
};

export default connect(({ global }) => ({
  selectedCluster: global.selectedCluster,
  clusterList: global.clusterList,
  clusterStatus: global.clusterStatus,
}))(Page);
