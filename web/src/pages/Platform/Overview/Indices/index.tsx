import { ESPrefix } from "@/services/common";
import Metrics from "./Detail/Metrics";
import Infos from "./Detail/Infos";
import Card from "./Card";
import Table from "./Table";
import Overview from "@/components/Overview";
import { getAllTimeSettingsCache } from "@/components/Overview/Monitor";

const facetLabels = {
  "metadata.cluster_name": "cluster",
  "metadata.labels.health_status": "health",
  "metadata.labels.state": "state",
};

const aggsParams = [
  { field: "metadata.cluster_name", params: { size: 150 } },
  { field: "metadata.labels.state", params: { size: 100 } },
  { field: "metadata.labels.health_status", params: { size: 150 } },
];

const details = [
  { title: "Metrics", component: Metrics, key: "metrics" },
  { title: "Infos", component: Infos, key: "infos" },
];

const sideSorterOptions = [
  { label: "Timestamp", key: "timestamp" },
  { label: "Index Name", key: "metadata.index_name" },
];

export default () => {

  const allTimeSettingsCache = getAllTimeSettingsCache()

  return (
    <Overview
      extraQueryFields={["index_id"]}
      searchAction={`${ESPrefix}/index/_search`}
      searchHighlightFields={[
        "metadta.index_name",
        "metadata.aliases",
        "metadta.cluster_name",
      ]}
      searchAutoCompleteConfig={{
        showStatus: true,
        defaultSearchField: 'metadata.index_name',
        getSearch: (item) => ({
          keyword: item?._source?.metadata?.index_name,
          filter: { value: [item?._source?.metadata?.cluster_name], field: 'metadata.cluster_name' }
        }),
        getOptionMeta: (item) => ({
          title:
            item?.highlight?.index_name || item?._source?.metadata?.index_name,
          desc:
            item?.highlight?.cluster_name ||
            item?._source?.metadata?.cluster_name,
          status: item?._source?.metadata?.labels?.health_status,
          text: item?._source?.metadata?.index_name
        }),
      }}
      infoAction={`${ESPrefix}/index/info?timeout=${allTimeSettingsCache.timeout || '10s'}`}
      facetLabels={facetLabels}
      aggsParams={aggsParams}
      sideSorterOptions={sideSorterOptions}
      details={details}
      listItemConfig={{
        component: Card,
        getId: (item) => item?._source?.metadata?.index_id,
      }}
      tableConfig={{
        component: Table,
      }}
      detailTitleConfig={{
        getLabels: (item) => [
          item._source?.metadata?.cluster_name,
          item._source?.metadata?.index_name,
        ],
        getStatus: (item) =>
          item._source?.metadata?.labels.health_status || "unavailable",
      }}
    />
  );
};
