import Metrics from "./Detail/Metrics";
import Infos from "./Detail/Infos";
import Card from "./Card";
import Table from "./Table";
import Overview from "@/components/Overview";
import Discover from "./Discover";
import Edit from "./Detail/Edit";
import { useRef } from "react";

const facetLabels = {
  "os_info.platform": "os",
  agent_status: "agent status",
};

const selectFilterLabels = {
  name: "name",
  ip: "ip",
  ...facetLabels,
};

const aggsParams = [
  { field: "os_info.platform", params: { size: 10 } },
  { field: "agent_status", params: { size: 100 } },
];

const details = [
  { title: "Metrics", component: Metrics, key: "metrics" },
  { title: "Infos", component: Infos, key: "infos" },
  { title: "Edit", component: Edit, key: "edit" },
];

const sideSorterOptions = [
  { label: "Timestamp", key: "updated" },
  { label: "Host Name", key: "name" },
];

export default () => {
  const ref = useRef<{ refresh: () => void }>(null);

  return (
    <Overview
      ref={ref}
      searchAction={`/host/_search`}
      searchHighlightFields={["name", "ip", "os_info.platform"]}
      searchAutoCompleteConfig={{
        showStatus: true,
        showTags: true,
        getOptionMeta: (item) => ({
          title: item.highlight?.name || item._source?.name,
          desc: item.highlight?.platform || item._source?.os_info?.platform,
          right: item.highlight?.ip || item._source?.ip,
          tags: item._source?.tags,
        }),
      }}
      infoAction={`/host/info`}
      facetLabels={facetLabels}
      selectFilterLabels={selectFilterLabels}
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
        getLabels: (item) => [
          item._source?.name,
          item._source?.os_info?.platform,
        ],
      }}
      headerConfig={{
        getExtra: (props) => [
          <Discover
            onAdd={() => {
              ref.current?.refresh();
            }}
          />,
        ],
      }}
    />
  );
};
