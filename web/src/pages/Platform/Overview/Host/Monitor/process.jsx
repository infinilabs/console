import { Table, Tag, Input, Switch, Button } from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import Link from "umi/link";
import { useEffect, useMemo } from "react";
import request from "@/utils/request";
import StatisticBar from "./statistic_bar";
import { formatter } from "@/utils/format";
import { filterSearchValue, sorter, formatUtcTimeToLocal } from "@/utils/utils";
import { formatTimeRange } from "@/lib/elasticsearch/util";
import moment from 'moment';

const { Search } = Input;

export default ({ hostID }) => {
  const [searchValue, setSearchValue] = React.useState("");

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
      case "refresh":
        return {
          ...queryParams,
          _t: new Date().getTime(),
        };
      default:
        throw new Error();
    }
  }
  const [queryParams, dispatch] = React.useReducer(reducer, initialQueryParams);

  const onRefreshClick = () => {
    dispatch({ type: "refresh" });
  };
  const {
    loading,
    error,
    value,
  } = useFetch(`/host/${hostID}/processes`, {}, [
    hostID,
    queryParams,
  ]);

  const [hits, hitsTotal] = React.useMemo(() => {
    const hits = value?.elastic_processes || [];

    if (searchValue) {
      hits = filterSearchValue(searchValue, hits, ["pid", "cluster_name", 'node_name', 'pid_status']);
    }

    return [hits, hits.length];
  }, [value, searchValue]);

  const columns = [
    {
      title: "PID",
      dataIndex: "pid",
    },
    {
      title: "Cluster",
      dataIndex: "cluster_name",
    },
    {
      title: "Node",
      dataIndex: "node_name",
    },
    {
      title: "Status",
      dataIndex: "pid_status",
    },
    {
      title: "UpTime",
      dataIndex: "uptime_in_ms",
      render: (text) => moment.duration(text, "ms").humanize(),
    },
  ];

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
        <div style={{ maxWidth: 500, flex: "1 1 auto" }}>
          <Search
            allowClear
            placeholder="Type keyword to search"
            enterButton="Search"
            onSearch={(value) => {
              setSearchValue(value);
            }}
            onChange={(e) => {
              setSearchValue(e.target.value);
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
        </div>
      </div>
      <Table
        loading={loading}
        bordered
        size={"small"}
        dataSource={hits}
        rowKey={(record) => `${hostID}${record.pid}`}
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
