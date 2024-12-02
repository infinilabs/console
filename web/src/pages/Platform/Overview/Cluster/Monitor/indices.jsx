import { Table, Switch, Input, Icon } from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import Link from "umi/link";
import { useEffect, useMemo } from "react";
import { HealthStatusView } from "@/components/infini/health_status_view";
import FilterSearchGroup from "@/components/infini/search/FilterSearchGroup";
import { formatter } from "@/utils/format";
import { filterSearchValue, sorter, formatUtcTimeToLocal } from "@/utils/utils";
import { formatTimeRange } from "@/lib/elasticsearch/util";
import IconText from "@/components/infini/IconText";

const { Search } = Input;

const Indices = ({
  clusterID,
  clusterName,
  timeRange,
  clusterAvailable,
  bucketSize,
}) => {
  const filterFields = {
    index: "Name",
    health: "Health",
  };
  const [searchValue, setSearchValue] = React.useState("");
  const [searchFilterFields, setSearchFilterFields] = React.useState([]);
  const [showSystemIndices, setShowSystemIndices] = React.useState(false);
  const [showRealtime, setShowRealtime] = React.useState(true);

  useEffect(() => {
    setShowRealtime(clusterAvailable);
  }, [clusterID, clusterAvailable]);

  const initialQueryParams = {
    from: 0,
    size: 20,
  };

  function reducer(queryParams, action) {
    switch (action.type) {
      case "pageSizeChange":
        return {
          ...queryParams,
          size: action.value,
        };
      default:
        throw new Error();
    }
  }
  const [queryParams, dispatch] = React.useReducer(reducer, initialQueryParams);

  const {
    loading: indicesLoading,
    error: indicesError,
    value: indicesValue,
  } = useFetch(
    `${ESPrefix}/${clusterID}/indices${showRealtime ? "/realtime" : ""}`,
    {
      queryParams: showRealtime ? {} : formatTimeRange(timeRange),
    },
    [clusterID, timeRange, showRealtime]
  );

  const [hits, hitsTotal] = useMemo(() => {
    let hits = Array.isArray(indicesValue)
      ? indicesValue.map((item) => {
          if (!item["docs_count"]) {
            item["docs_count"] = 0;
          }
          item["store_size"] = item["store_size"]?.toUpperCase();
          item["store_size_bytes"] = formatter.bytesReverse(
            item?.["store_size"]
          );
          return item;
        })
      : [];

    if (!showSystemIndices) {
      hits = hits.filter((item) => !item?.index?.startsWith("."));
    }

    if (searchValue) {
      let searchableFields = searchFilterFields.length
        ? searchFilterFields
        : Object.keys(filterFields);
      hits = filterSearchValue(searchValue, hits, searchableFields);
    }

    return [hits, hits.length];
  }, [indicesValue, showSystemIndices, searchValue]);

  const [columns] = useMemo(() => {
    let columns = [
      {
        title: "Name",
        dataIndex: "index",
        render: (text, record) => (
          <IconText
            icon={<Icon type="table" />}
            text={
              <Link
                to={`/cluster/monitor/${clusterID}/indices/${
                  record?.index
                }?_g={"timeRange":${encodeURIComponent(JSON.stringify(
                  timeRange
                ))},"timeInterval":"${bucketSize}","cluster_name":"${clusterName}"}`}
              >
                {text}
              </Link>
            }
          />
        ),
        sorter: (a, b) => sorter.string(a, b, "index"),
      },
      {
        title: "Health",
        dataIndex: "health",
        render: (text, record) => <HealthStatusView status={record?.health} />,
        sorter: (a, b) => sorter.string(a, b, "health"),
      },
      {
        title: "Status",
        dataIndex: "status",
        sorter: (a, b) => sorter.string(a, b, "status"),
      },
      {
        title: "Shards",
        dataIndex: "shards",
        render: (text, record) => <span>{text || 0}</span>,
        sorter: (a, b) => a?.shards - b?.shards,
      },
      {
        title: "Replicas",
        dataIndex: "replicas",
        render: (text, record) => <span>{text || 0}</span>,
        sorter: (a, b) => a?.replicas - b?.replicas,
      },
      {
        title: "Document Count",
        dataIndex: "docs_count",
        render: (text, record) => <span>{formatter.number(text || 0)}</span>,
        sorter: (a, b) => a?.docs_count - b?.docs_count,
      },
      {
        title: "Data",
        dataIndex: "store_size_bytes",
        render: (text, record) => <span>{record?.store_size || 0}</span>,
        sorter: (a, b) => a?.store_size_bytes - b?.store_size_bytes,
      },
    ];
    if (showRealtime) {
      columns.push({
        title: "Pri Indexing Rate",
        dataIndex: "index_qps",
        render: (text, record) => (
          <span>{text != null ? `${text} /s` : "N/A"}</span>
        ),
        sorter: (a, b) => a?.index_qps - b?.index_qps,
      });
      columns.push({
        title: "Pri Indexing Bytes",
        dataIndex: "index_bytes_qps",
        render: (text, record) => (
          <span>
            {text != null ? `${formatter.bytes(text || 0)} /s` : "N/A"}
          </span>
        ),
        sorter: (a, b) => a?.index_bytes_qps - b?.index_bytes_qps,
      });
      columns.push({
        title: "Search Rate",
        dataIndex: "query_qps",
        render: (text, record) => (
          <span>{text != null ? `${text} /s` : "N/A"}</span>
        ),
        sorter: (a, b) => a?.query_qps - b?.query_qps,
      });
    } else {
      columns.push({
        title: "Timestamp",
        dataIndex: "timestamp",
        render: (text, record) => <span>{formatUtcTimeToLocal(text)}</span>,
        sorter: (a, b) => sorter.string(a, b, "timestamp"),
      });
    }

    return [columns];
  }, [showRealtime, timeRange]);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 15,
        }}
      >
        <div style={{ maxWidth: 600, flex: "1 1 auto" }}>
          <FilterSearchGroup
            filterWidth={120}
            filterFields={filterFields}
            onFilterChange={(value) => {
              let val = value ? [value] : [];
              setSearchFilterFields(val);
            }}
            onSearch={(value) => {
              setSearchValue(value);
            }}
            onChange={(value) => {
              setSearchValue(value);
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {formatMessage({ id: "indices.show_special_index" })}
            <Switch
              onChange={(checked) => {
                setShowSystemIndices(checked);
              }}
              defaultChecked={showSystemIndices}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {formatMessage({ id: "indices.show_realtime" })}
            <Switch
              onChange={(checked) => {
                setShowRealtime(checked);
              }}
              checked={showRealtime}
            />
          </div>
        </div>
      </div>
      <Table
        loading={indicesLoading}
        bordered
        size={"small"}
        dataSource={hits}
        rowKey={"id"}
        columns={columns}
        pagination={{
          size: "small",
          pageSize: queryParams.size,
          total: hitsTotal,
          showSizeChanger: true,
          onShowSizeChange: (_, size) => {
            dispatch({ type: "pageSizeChange", value: size });
          },
        }}
      />
    </>
  );
};

export default Indices;
