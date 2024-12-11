import { ESPrefix } from "@/services/common";
import Metrics from "./Detail/Metrics";
import Infos from "./Detail/Infos";
import Card from "./Card";
import Table from "./Table";
import Overview from "@/components/Overview";
import Logs from "./Detail/Logs";

const facetLabels = {
  "metadata.cluster_name": "cluster",
  "metadata.labels.version": "version",
  "metadata.labels.status": "status",
  "metadata.labels.roles": "roles",
};

const selectFilterLabels = {
  "metadata.node_id": "uuid",
  "metadata.host": "host",
  ...facetLabels,
};

const aggsParams = [
  { field: "metadata.labels.status", params: { size: 10 } },
  { field: "metadata.labels.roles", params: { size: 100 } },
  { field: "metadata.labels.version", params: { size: 150 } },
  { field: "metadata.cluster_name", params: { size: 300 } },
];

const details = [
  { title: "Metrics", component: Metrics, key: "metrics" },
  { title: "Infos", component: Infos, key: "infos" },
  { title: "Logs", component: Logs, key: "logs" },
];

const sideSorterOptions = [
  { label: "Timestamp", key: "timestamp" },
  { label: "Node Name", key: "metadata.node_name" },
];

export default () => {
  return (
    <Overview
      extraQueryFields={["node_id"]}
      searchAction={`${ESPrefix}/node/_search`}
      searchHighlightFields={[
        "metadata.node_name",
        "metadata.host",
        "metadata.cluster_name",
      ]}
      searchAutoCompleteConfig={{
        defaultSearchField: 'metadata.node_name',
        getSearch: (item) => ({
          keyword: item?._source?.metadata?.node_name,
          filter: { value: [item?._source?.metadata?.cluster_name], field: 'metadata.cluster_name' }
        }),
        getOptionMeta: (item) => ({
          title:
            item?.highlight?.node_name || item?._source?.metadata?.node_name,
          desc:
            item?.highlight?.cluster_name ||
            item?._source?.metadata?.cluster_name,
          right: item?.highlight?.host || item?._source?.metadata?.host,
          text: item?._source?.metadata?.node_name
        }),
      }}
      infoAction={`${ESPrefix}/node/info?timeout=120s`}
      facetLabels={facetLabels}
      selectFilterLabels={selectFilterLabels}
      aggsParams={aggsParams}
      sideSorterOptions={sideSorterOptions}
      details={details}
      listItemConfig={{
        component: Card,
        getId: (item) => item?._source?.metadata?.node_id,
      }}
      tableConfig={{
        component: Table,
      }}
      detailTitleConfig={{
        getLabels: (item) => [
          item._source?.metadata?.cluster_name,
          item._source?.metadata?.node_name,
        ],
        getStatus: (item) =>
          item._source?.metadata?.labels?.status || "unavailable",
      }}
    />
  );
};
