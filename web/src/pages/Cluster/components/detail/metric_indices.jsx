import React, { useState, useEffect } from "react";
import {
  Icon,
  Table,
  Tooltip,
  List,
  Button,
  Input,
  Switch,
  Dropdown,
  Menu,
} from "antd";
import { ESPrefix } from "@/services/common";
import useFetch from "@/lib/hooks/use_fetch";
import { formatter } from "@/utils/format";
import moment from "moment";
import { Link } from "react-router-dom";
import { formatMessage } from "umi/locale";
import { filterSearchValue, sorter } from "@/utils/utils";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { formatTimeRange } from "@/lib/elasticsearch/util";

const { Search } = Input;

export const MetricIndices = ({
  clusterID,
  clusterName,
  timeRange,
  fetchUrl = "",
}) => {
  if (!clusterID) {
    return null;
  }

  const [searchValue, setSearchValue] = React.useState("");
  const [showSystemIndices, setShowSystemIndices] = React.useState(false);
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
    fetchUrl || `${ESPrefix}/${clusterID}/indices`,
    {
      queryParams: formatTimeRange(timeRange),
    },
    [clusterID, timeRange]
  );

  const [hits, hitsTotal] = React.useMemo(() => {
    let hits = Array.isArray(value)
      ? value.map((item) => {
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
    if (!showUnavailable) {
      hits = hits.filter(
        (item) =>
          item?.health &&
          !(
            ["N/A", "unavailable"].indexOf(item?.health) > -1 ||
            ["delete"].indexOf(item?.status) > -1
          )
      );
    }

    if (searchValue) {
      hits = filterSearchValue(searchValue, hits, [
        "index",
        "health",
        "status",
      ]);
    }

    return [hits, hits.length];
  }, [value, searchValue, showSystemIndices, showUnavailable]);

  const columns = [
    {
      title: "Name",
      dataIndex: "index",
      render: (text, record) => (
        <span>
          <Link
            to={`/cluster/monitor/${clusterID}/indices/${text}?_g={"cluster_name":"${clusterName}"}`}
          >
            {text}
          </Link>
        </span>
      ),
      sorter: (a, b) => sorter.string(a, b, "index"),
    },
    {
      title: "Health",
      dataIndex: "health",
      render: (text, record) => <HealthStatusView status={record?.health} />,
      sorter: (a, b) => sorter.string(a, b, "health"),
    },
  ];

  const menu = (
    <Menu>
      <Menu.Item>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {formatMessage({ id: "indices.show_special_index" })}
          <Switch
            style={{ marginLeft: 5 }}
            onChange={(checked) => {
              setShowSystemIndices(checked);
            }}
            defaultChecked={showSystemIndices}
          />
        </div>
      </Menu.Item>
      <Menu.Item>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {formatMessage({ id: "indices.show_unavailable_index" })}
          <Switch
            style={{ marginLeft: 5 }}
            onChange={(checked) => {
              setShowUnavailable(checked);
            }}
            defaultChecked={showUnavailable}
          />
        </div>
      </Menu.Item>
    </Menu>
  );

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
        <Dropdown overlay={menu} placement="bottomRight">
          <Button>{formatMessage({ id: "indices.button.filters" })}</Button>
        </Dropdown>
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
