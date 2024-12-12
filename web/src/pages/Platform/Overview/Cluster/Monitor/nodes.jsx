import { Table, Switch, Input, Select, Icon, Tooltip } from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import Link from "umi/link";
import { useMemo } from "react";
import { HealthStatusView } from "@/components/infini/health_status_view";
import FilterSearchGroup from "@/components/infini/search/FilterSearchGroup";
import { filterSearchValue, sorter, formatUtcTimeToLocal } from "@/utils/utils";
import "./nodes.scss";
import { formatter } from "@/utils/format";
import { formatTimeRange } from "@/lib/elasticsearch/util";
import moment from "moment";
import IconText from "@/components/infini/IconText";
import AutoTextEllipsis from "@/components/AutoTextEllipsis";

const { Search } = Input;
const InputGroup = Input.Group;
const { Option } = Select;

export default ({
  clusterID,
  clusterName,
  timeRange,
  clusterAvailable,
  bucketSize,
}) => {
  const initialQueryParams = {
    from: 0,
    size: 20,
  };
  const filterFields = {
    name: "Name",
    ip: "IP",
  };
  const [searchValue, setSearchValue] = React.useState("");
  const [searchFilterFields, setSearchFilterFields] = React.useState([]);
  const [showRealtime, setShowRealtime] = React.useState(clusterAvailable);
  useMemo(() => {
    setShowRealtime(clusterAvailable);
  }, [clusterID, clusterAvailable]);

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
    loading: nodesLoading,
    error: nodesError,
    value: nodesValue,
  } = useFetch(
    `${ESPrefix}/${clusterID}/nodes${showRealtime ? "/realtime" : ""}`,
    {
      queryParams: showRealtime ? {} : formatTimeRange(timeRange),
    },
    [clusterID, timeRange, showRealtime]
  );

  const [hits, hitsTotal] = React.useMemo(() => {
    let hits = Array.isArray(nodesValue)
      ? nodesValue.map((item) => {
          item["disk.avail"] = item["disk.avail"]?.toUpperCase();
          item["disk_avail_bytes"] = formatter.bytesReverse(
            item?.["disk.avail"]
          );
          item["disk_used_bytes"] = formatter.bytesReverse(item?.["disk.used"]);
          item["uptime_ms"] = formatter.uptimeToMilliseconds(item["uptime"]);
          item["status"] = item["status"] ?? "available";
          return item;
        })
      : [];

    if (searchValue) {
      let searchableFields = searchFilterFields.length
        ? searchFilterFields
        : Object.keys(filterFields);
      hits = filterSearchValue(searchValue, hits, searchableFields);
    }

    return [hits, hits.length];
  }, [nodesValue, searchValue]);

  const [columns] = React.useMemo(() => {
    let columns = [
      {
        title: "Name",
        dataIndex: "name",
        render: (text, record) => (
          <span>
            <IconText
              icon={
                record?.master == "*" ? (
                  <Tooltip title={"Master Node"}>
                    <Icon type="star" theme="filled" />
                  </Tooltip>
                ) : (
                  <Tooltip title={"Not Master Node"}>
                    <Icon type="database" />
                  </Tooltip>
                )
              }
              text={
                <Link
                  to={`/cluster/monitor/${clusterID}/nodes/${
                    record?.id
                  }?_g={"timeRange":${encodeURIComponent(JSON.stringify(
                    timeRange
                  ))},"timeInterval":"${bucketSize}","cluster_name":"${clusterName}","node_name":"${
                    record?.name
                  }"}`}
                >
                  <AutoTextEllipsis >{text}</AutoTextEllipsis>
                </Link>
              }
            />
            <div>
              {record?.ip}:{record?.port}
            </div>
          </span>
        ),
        sorter: (a, b) => sorter.string(a, b, "name"),
        className: "verticalAlign",
      },
    ];
    if (showRealtime) {
      columns.push({
        title: "Status",
        dataIndex: "status",
        render: (text, record) => (
          <HealthStatusView status={text ?? "available"} />
        ),
        sorter: (a, b) => sorter.string(a, b, "status"),
        className: "verticalAlign",
      });
    }
    columns = columns.concat([
      {
        title: "Shards",
        dataIndex: "shards",
        render: (text, record) => <span>{text || "N/A"}</span>,
        sorter: (a, b) => a?.shards - b?.shards,
        className: "verticalAlign",
      },
      {
        title: "CPU Usage",
        dataIndex: "cpu",
        render: (text, record) => <span>{text ? `${text}%` : "N/A"}</span>,
        sorter: (a, b) => a?.cpu - b?.cpu,
        className: "verticalAlign",
      },
      {
        title: "Load Average",
        dataIndex: "load_1m",
        render: (text, record) => (
          <span>
            {text && parseFloat(text) > 0 ? parseFloat(text).toFixed(2) : "N/A"}
          </span>
        ),
        sorter: (a, b) => a?.load_1m - b?.load_1m,
        className: "verticalAlign",
      },
      {
        title: "JVM Heap",
        dataIndex: "heap.percent",
        render: (text, record) => <span>{text ? `${text}%` : "N/A"}</span>,
        sorter: (a, b) => a?.["heap.percent"] - b?.["heap.percent"],
        className: "verticalAlign",
      },
      {
        title: "Disk Free Space",
        dataIndex: "disk_avail_bytes",
        render: (text, record) => <span>{record["disk.avail"] || "N/A"}</span>,
        sorter: (a, b) => a?.disk_avail_bytes - b?.disk_avail_bytes,
        className: "verticalAlign",
      },
      {
        title: "Disk Used Space",
        dataIndex: "disk_used_bytes",
        render: (text, record) => <span>{record["disk.used"] || "N/A"}</span>,
        sorter: (a, b) => a?.disk_used_bytes - b?.disk_used_bytes,
        className: "verticalAlign",
      },
    ]);
    if (showRealtime) {
      columns.push({
        title: "Uptime",
        dataIndex: "uptime_ms",
        render: (text, record) => <span>{record["uptime"] || "N/A"}</span>,
        sorter: (a, b) => a?.uptime_ms - b?.uptime_ms,
        className: "verticalAlign",
      });
      columns.push({
        title: "Indexing Rate",
        dataIndex: "index_qps",
        render: (text, record) => (
          <span>{text != null ? `${text} /s` : "N/A"}</span>
        ),
        sorter: (a, b) => a?.index_qps - b?.index_qps,
        className: "verticalAlign",
      });
      columns.push({
        title: "Indexing Bytes",
        dataIndex: "index_bytes_qps",
        render: (text, record) => (
          <span>
            {text != null ? `${formatter.bytes(text || 0)} /s` : "N/A"}
          </span>
        ),
        sorter: (a, b) => a?.index_bytes_qps - b?.index_bytes_qps,
        className: "verticalAlign",
      });
      columns.push({
        title: "Search Rate",
        dataIndex: "query_qps",
        render: (text, record) => (
          <span>{text != null ? `${text} /s` : "N/A"}</span>
        ),
        sorter: (a, b) => a?.query_qps - b?.query_qps,
        className: "verticalAlign",
      });
    } else {
      columns.push({
        title: "Timestamp",
        dataIndex: "timestamp",
        render: (text, record) => <span>{formatUtcTimeToLocal(text)}</span>,
        sorter: (a, b) => sorter.string(a, b, "timestamp"),
        className: "verticalAlign",
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
        loading={nodesLoading}
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
