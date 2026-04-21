import React, { useState, useEffect, useMemo } from "react";
import { Icon, Table, Tooltip, List, Button, Input, Switch } from "antd";
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

const SourceIndices = ({
  clusterID,
  onSelectChange,
  selectedIndicesRowKeys,
}) => {
  if (!clusterID) {
    return null;
  }
  const [selectedRowKeys, setSelectedRowKeys] = useState(
    selectedIndicesRowKeys || []
  );

  useMemo(() => {
    setSelectedRowKeys(selectedIndicesRowKeys);
  }, [selectedIndicesRowKeys]);

  const [searchValue, setSearchValue] = React.useState("");
  const [showSystemIndices, setShowSystemIndices] = React.useState(false);

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

  const {
    loading,
    error,
    value,
  } = useFetch(`${ESPrefix}/${clusterID}/indices/realtime`, {}, [clusterID]);

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

    if (searchValue) {
      hits = filterSearchValue(searchValue, hits, ["index"]);
    }

    hits = hits.filter((item) => item.docs_count > 0);

    return [hits, hits.length];
  }, [value, searchValue, showSystemIndices]);

  const columns = [
    {
      title: "Name",
      dataIndex: "index",
      sorter: (a, b) => sorter.string(a, b, "index"),
    },
    {
      title: "Shards",
      dataIndex: "shards",
      render: (text, record) => <span>{text || 0}</span>,
      sorter: (a, b) => a?.shards - b?.shards,
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      const keepRows = [];
      keys.forEach((key) => {
        if (
          rows.findIndex((item) => item.index === key) === -1 &&
          Array.isArray(value)
        ) {
          keepRows.push(value.find((item) => item.index === key));
        }
      });
      setSelectedRowKeys(keys);
      onSelectChange([...keepRows, ...rows]);
    },
  };

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ maxWidth: 400, flex: "1 1 auto" }}>
            <Search
              allowClear
              placeholder="Type keyword to search"
              onSearch={(value) => {
                setSearchValue(value);
              }}
              onChange={(e) => {
                setSearchValue(e.currentTarget.value);
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
          </div>
        </div>
      </div>
      <div className="tableSmall">
        <Table
          loading={loading}
          size={"small"}
          bordered
          rowSelection={rowSelection}
          dataSource={hits}
          rowKey={"index"}
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

export default SourceIndices;
