import React, { useState, useEffect } from "react";
import { Icon, Table, Tooltip, List, Button, Input, Switch } from "antd";
import { ESPrefix } from "@/services/common";
import useFetch from "@/lib/hooks/use_fetch";
import { formatter } from "@/utils/format";
import { formatMessage } from "umi/locale";
import moment from "moment";
import { Link } from "react-router-dom";
import { filterSearchValue, sorter } from "@/utils/utils";
import { formatTimeRange } from "@/lib/elasticsearch/util";
import { HealthStatusView } from "@/components/infini/health_status_view";

const { Search } = Input;

export const MetricNodes = ({
  clusterID,
  clusterName,
  timeRange,
  fetchUrl = "",
}) => {
  if (!clusterID) {
    return null;
  }

  const [searchValue, setSearchValue] = React.useState("");
  const [showUnavailable, setShowUnavailable] = React.useState(false);
  const initialQueryParams = {
    from: 0,
    size: 10,
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

  const { loading, error, value } = useFetch(
    fetchUrl || `${ESPrefix}/${clusterID}/nodes`,
    {
      queryParams: formatTimeRange(timeRange),
    },
    [clusterID, timeRange]
  );

  const [hits, hitsTotal] = React.useMemo(() => {
    let hits = Array.isArray(value)
      ? value.map((item) => {
          item["transport_address"] = item["ip"] + ":" + item["port"];
          return item;
        })
      : [];

    if (!showUnavailable) {
      hits = hits.filter(
        (item) => !(["N/A", "unavailable"].indexOf(item?.status) > -1)
      );
    }

    if (searchValue) {
      hits = filterSearchValue(searchValue, hits, [
        "name",
        "status",
        "transport_address",
      ]);
    }

    return [hits, hits.length];
  }, [value, searchValue, showUnavailable]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text, record) => (
        <span>
          <Link
            to={`/cluster/monitor/${clusterID}/nodes/${record.id}?_g={"cluster_name":"${clusterName}","node_name":"${record.name}"}`}
          >
            {text}
          </Link>
        </span>
      ),
      sorter: (a, b) => sorter.string(a, b, "name"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text, record) => <HealthStatusView status={text} />,
      sorter: (a, b) => sorter.string(a, b, "status"),
    },
    // {
    //   title: "Transport Address",
    //   dataIndex: "transport_address",
    //   render: (text, record) => <span>{text}</span>,
    //   sorter: (a, b) => sorter.string(a, b, "transport_address"),
    // },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ maxWidth: 300, flex: "1 1 auto" }}>
          <Search
            placeholder="Type keyword to search"
            onSearch={(value) => {
              setSearchValue(value);
            }}
            onChange={(e) => {
              setSearchValue(e.currentTarget.value);
            }}
            enterButton
          />
        </div>
        <div>
          {formatMessage({ id: "indices.show_unavailable_node" })}
          <Switch
            style={{ marginLeft: 5 }}
            onChange={(checked) => {
              setShowUnavailable(checked);
            }}
            defaultChecked={showUnavailable}
          />
        </div>
      </div>
      <div className="tableSmall">
        <Table
          loading={loading}
          size={"small"}
          bordered
          dataSource={hits}
          rowKey={(record, index) => index}
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
