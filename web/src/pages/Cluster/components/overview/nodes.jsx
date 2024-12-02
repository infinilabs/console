import { Table, Switch, Input, Select, Icon, Tooltip } from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import Link from "umi/link";
import { useMemo } from "react";
import StatisticBar from "./statistic_bar";
import ClusterMetric from "../cluster_metric";
import { HealthStatusView } from "@/components/infini/health_status_view";
import FilterSearchGroup from "@/components/infini/search/FilterSearchGroup";
import { filterSearchValue, sorter, formatUtcTimeToLocal } from "@/utils/utils";
import "./nodes.scss";
import { formatter } from "@/utils/format";
import { formatTimeRange } from "@/lib/elasticsearch/util";
import moment from "moment";

const { Search } = Input;
const InputGroup = Input.Group;
const { Option } = Select;

const Nodes = ({
  clusterID,
  clusterName,
  timeRange,
  setSpinning,
  clusterAvailable,
  clusterMonitored,
}) => {
  if (!clusterID) {
    return null;
  }

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
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {record?.master == "*" ? (
                <Tooltip title={"Master Node"}>
                  <Icon type="star" theme="filled" />
                </Tooltip>
              ) : (
                <Tooltip title={"Not Master Node"}>
                  <Icon type="database" />
                </Tooltip>
              )}

              <Link
                to={`/cluster/monitor/${clusterID}/nodes/${record?.id}?_g={"cluster_name":"${clusterName}","node_name":"${record?.name}"}`}
              >
                {text}
              </Link>
            </div>
            <div>
              {record?.ip}:{record?.port}
            </div>
          </span>
        ),
        sorter: (a, b) => sorter.string(a, b, "name"),
        className: "verticalAlign",
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (text, record) => (
          <HealthStatusView status={text ?? "available"} />
        ),
        className: "verticalAlign",
      },
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
    ];
    if (showRealtime) {
      columns.push({
        title: "Uptime",
        dataIndex: "uptime",
        render: (text, record) => <span>{text || "N/A"}</span>,
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
  }, [showRealtime]);

  return (
    <div>
      <StatisticBar
        clusterID={clusterID}
        timeRange={timeRange}
        setSpinning={setSpinning}
        clusterAvailable={clusterAvailable}
        clusterMonitored={clusterMonitored}
      />
      <div style={{ marginTop: 15 }}>
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
      </div>
    </div>
  );
};

export default Nodes;
