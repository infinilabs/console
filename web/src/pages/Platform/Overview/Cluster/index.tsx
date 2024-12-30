import { ESPrefix } from "@/services/common";
import Metrics from "./Detail/Metrics";
import { MetricTopN } from "./Detail/MetricTopN";
import Infos from "./Detail/Infos";
import Card from "./Card";
import Table from "./Table";
import Overview from "@/components/Overview";
import { getAllTimeSettingsCache } from "@/components/Overview/Monitor";

const facetLabels = {
  "labels.health_status": "health status",
  distribution: "distribution",
  version: "version",
  "location.region": "region",
  tags: "tags",
};

const aggsParams = [
  { field: "version", params: { size: 100 } },
  { field: "labels.health_status", params: { size: 150 } },
  { field: "tags", params: { size: 150 } },
  { field: "distribution", params: { size: 10 } },
  { field: "location.region", params: { size: 100 } },
];

const details = [
  { title: "Metrics", component: Metrics, key: "metrics" },
  { title: "TopN", component: MetricTopN, key: "topN" },
  { title: "Infos", component: Infos, key: "infos" },
];

const sideSorterOptions = [
  { label: "Timestamp", key: "updated" },
  { label: "Cluster Name", key: "name" },
];

export default () => {

  const allTimeSettingsCache = getAllTimeSettingsCache()

  return (
    <Overview
      searchAction={`${ESPrefix}/cluster/_search`}
      searchHighlightFields={["name", "host", "version"]}
      searchAutoCompleteConfig={{
        showStatus: true,
        showTags: true,
        defaultSearchField: 'name',
        getSearch: (item) => ({
          keyword: item?._source?.name,
        }),
        getOptionMeta: (item) => ({
          title: item.highlight?.name || item._source?.name,
          desc: item.highlight?.version || item._source?.version,
          right: item.highlight?.host || item._source?.host,
          tags: item._source?.tags,
          status: item._source.labels?.health_status,
          text: item?._source?.name
        }),
      }}
      infoAction={`${ESPrefix}/cluster/info?timeout=${allTimeSettingsCache.timeout || '10s'}`}
      facetLabels={facetLabels}
      aggsParams={aggsParams}
      sideSorterOptions={sideSorterOptions}
      details={details}
      listItemConfig={{
        component: Card,
        getId: (item) => item?._id,
      }}
      tableConfig={{
        component: Table,
      }}
      detailTitleConfig={{
        getLabels: (item) => [item._source?.name, item._source?.version],
        getStatus: (item) =>
          item._source?.labels?.health_status || "unavailable",
      }}
    />
  );
};
