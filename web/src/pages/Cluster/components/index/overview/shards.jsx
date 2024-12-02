import { Table, Tag, Input, Button } from "antd";
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

const { Search } = Input;

const Shards = ({
  clusterID,
  clusterName,
  indexName,
  timeRange,
  setSpinning,
}) => {
  if (!clusterID || !indexName) {
    return null;
  }
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
  } = useFetch(`${ESPrefix}/${clusterID}/index/${indexName}/shards`, {}, [
    clusterID,
    indexName,
    queryParams,
  ]);

  const [hits, hitsTotal] = React.useMemo(() => {
    let hits = Array.isArray(value)
      ? value.map((item) => {
          if (!item["docs"]) {
            item["docs"] = "0";
          }
          if (!item["store_in_bytes"]) {
            item["store_in_bytes"] = 0;
          }
          return item;
        })
      : [];

    if (searchValue) {
      hits = filterSearchValue(searchValue, hits, [
        "index",
        "state",
        "node",
        "ip",
      ]);
    }

    return [hits, hits.length];
  }, [value, searchValue]);

  let columns = [
    {
      title: "Index",
      dataIndex: "index",
    },
    {
      title: "IP",
      dataIndex: "ip",
    },
    {
      title: "Node",
      dataIndex: "node",
      render: (text, record) => {
        return (
          <Link
            to={`/cluster/monitor/${clusterID}/nodes/${record?.id}?_g={"cluster_name":"${clusterName}","node_name":"${record?.node}"}`}
          >
            {text}
          </Link>
        );
      },
    },
    {
      title: "Prirep",
      dataIndex: "prirep",
      render: (text, record) => (
        <span>
          {text == "p" ? (
            <Tag color="#79AAD9">Primary</Tag>
          ) : (
            <Tag color="#6DCDB0">Replica</Tag>
          )}
        </span>
      ),
    },
    {
      title: "Shard",
      dataIndex: "shard",
    },
    {
      title: "State",
      dataIndex: "state",
      sorter: (a, b) => sorter.string(a, b, "state"),
    },
    {
      title: "Docs",
      dataIndex: "docs",
      render: (text, record) => <span>{record?.docs || 0}</span>,
      sorter: (a, b) => a?.docs - b?.docs,
    },
    {
      title: "Store",
      dataIndex: "store_size_bytes",
      render: (text, record) => <span>{record?.store || 0}</span>,
      sorter: (a, b) => a?.store_in_bytes - b?.store_in_bytes,
    },
  ];

  return (
    <div>
      <StatisticBar
        clusterID={clusterID}
        indexName={indexName}
        timeRange={timeRange}
        setSpinning={setSpinning}
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
            <Button
              icon="redo"
              onClick={() => {
                onRefreshClick();
              }}
            >
              {formatMessage({ id: "form.button.refresh" })}
            </Button>
          </div>
        </div>
        <Table
          loading={loading}
          bordered
          size={"small"}
          dataSource={hits}
          rowKey={(record) => `${record.index}${record.prirep}${record.shard}`}
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

export default Shards;
