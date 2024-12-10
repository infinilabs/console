import { ESPrefix } from "@/services/common";
import Metrics from "./Detail/Metrics";
import Infos from "./Detail/Infos";
import Card from "./Card";
import Table from "./Table";
import Overview from "@/components/Overview";

const facetLabels = {
  "metadata.index_name": "index",
  "metadata.labels.health_status": "health",
  "metadata.labels.state": "state",
};

const aggsParams = [
  { field: "metadata.index_name", params: { size: 500 } },
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
        getOptionMeta: (item) => ({
          title:
            item?.highlight?.index_name || item?._source?.metadata?.index_name,
          desc:
            item?.highlight?.cluster_name ||
            item?._source?.metadata?.cluster_name,
          status: item?._source?.metadata?.labels?.health_status,
        }),
      }}
      infoAction={`${ESPrefix}/index/info`}
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
