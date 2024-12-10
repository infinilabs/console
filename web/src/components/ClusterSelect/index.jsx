import { useState } from "react";
import { getLocale, formatMessage } from "umi/locale";

import DropdownList from "@/common/src/DropdownList";
import { SearchEngineIcon } from "@/lib/search_engines";
import { HealthStatusRect } from "../infini/health_status_rect";
import { connect } from "dva";
import { hasAuthority } from "@/utils/authority";

export default connect(({ global, loading }) => ({
  clusterList: global.clusterList,
  clusterLoading: loading.effects["global/fetchClusterList"],
  clusterStatus: global.clusterStatus,
}))((props) => {
  const {
    className,
    popoverClassName,
    children,
    width,
    dropdownWidth,
    selectedCluster,
    clusterList = [],
    clusterStatus,
    onChange,
    mode = "",
    onRefresh,
    clusterLoading,
    dispatch,
    showCreate = true
  } = props;

  const [sorter, setSorter] = useState([]);
  const [filters, setFilters] = useState({
    status: ["green", "yellow", "red"],
  });
  const [groups, setGroups] = useState([{ key: "distribution", value: "" }]);

  const formatItem = (item, clusterStatus) => {
    if (!item) return item;
    //mode: "multiple"
    if (Array.isArray(item)) {
      return item.map((subItem) => {
        return {
          ...subItem,
          status: clusterStatus?.[subItem.id]?.available
            ? clusterStatus?.[subItem.id].health?.status
            : "unavailable",
        };
      });
    }
    return {
      ...item,
      status: clusterStatus?.[item.id]?.available
        ? clusterStatus?.[item.id].health?.status
        : "unavailable",
    };
  };

  const actions = [];
  if (hasAuthority("system.cluster:all") && showCreate) {
    actions.push(
      <a onClick={() => window.open(`/#/resource/cluster/regist`,"_blank")}>
        {formatMessage({ id: "cluster.manage.btn.regist" })}
      </a>
    );
  }

  return (
    <DropdownList
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      mode={mode}
      className={className}
      popoverClassName={popoverClassName}
      width={width}
      dropdownWidth={dropdownWidth}
      locale={getLocale()}
      value={formatItem(selectedCluster, clusterStatus)}
      onChange={onChange}
      rowKey="id"
      data={clusterList.map((item) => formatItem(item, clusterStatus))}
      renderItem={(item) => {
        return (
          <>
            <div style={{
                marginRight: '5px',
                display: "inline-block",
                position: "relative",
                top: '3px',
              }}>
              <HealthStatusRect status={item.status} />
            </div>
            <div style={{
                marginRight: '4px',
                display: "inline-block",
                position: "relative",
                top: '-3px',
              }}>
              <SearchEngineIcon
                distribution={item.distribution}
                width="16px"
                height="16px"
              />
            </div>
            {item.name}
          </>
        );
      }}
      renderTag={(item) => item.version}
      searchKey="name"
      sorter={sorter}
      onSorterChange={setSorter}
      sorterOptions={[{ label: "Cluster Name", key: "name" }]}
      filters={filters}
      onFiltersChange={setFilters}
      filterOptions={[
        {
          label: "Health Status",
          key: "status",
          list: [
            {
              label: "Green",
              value: "green",
            },
            {
              label: "Yellow",
              value: "yellow",
            },
            {
              label: "Red",
              value: "red",
            },
            {
              label: "Unavailable",
              value: "unavailable",
            },
          ],
        },
        {
          label: "Version",
          key: "version",
          list: Array.from(new Set(clusterList.map((item) => item.version)))
            .sort((a, b) => b.localeCompare(a))
            .map((version) => ({ label: version, value: version })),
        },
      ]}
      groups={groups}
      onGroupsChange={setGroups}
      groupOptions={[
        {
          key: "distribution",
          label: "All",
          value: "",
        },
        {
          key: "distribution",
          label: "Elasticsearch",
          value: "elasticsearch",
        },
        {
          key: "distribution",
          label: "Easysearch",
          value: "easysearch",
        },
        {
          key: "distribution",
          label: "Opensearch",
          value: "opensearch",
        },
      ]}
      onRefresh={() => {
        dispatch({
          type: "global/fetchClusterList",
          payload: {
            size: 200,
            name: "",
          },
        });
        dispatch({
          type: "global/fetchClusterStatus",
        })
      }}
      loading={clusterLoading}
      actions={actions}
    >
      {children}
    </DropdownList>
  );
});
