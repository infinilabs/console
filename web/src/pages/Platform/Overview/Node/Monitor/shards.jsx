import { Table, Tag, Input, Switch, Button, Icon } from "antd";
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
import IconText from "@/components/infini/IconText";
import AutoTextEllipsis from "@/components/AutoTextEllipsis";

const { Search } = Input;

export default ({ clusterID, clusterName, nodeID, timeRange, bucketSize }) => {
  const [searchValue, setSearchValue] = React.useState("");
  const [showSystemIndices, setShowSystemIndices] = React.useState(false);

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
  } = useFetch(`${ESPrefix}/${clusterID}/node/${nodeID}/shards`, {}, [
    clusterID,
    nodeID,
    queryParams,
  ]);

  const [hits, hitsTotal] = React.useMemo(() => {
    if (value?.error) {
      return [[], 0];
    }
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

    if (!showSystemIndices) {
      hits = hits.filter((item) => !item?.index?.startsWith("."));
    }

    if (searchValue) {
      hits = filterSearchValue(searchValue, hits, ["index", "state"]);
    }

    return [hits, hits.length];
  }, [value, showSystemIndices, searchValue]);

  const [columns] = React.useMemo(() => {
    let columns = [
      {
        title: "Index",
        dataIndex: "index",
        render: (text, record) => {
          return (
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
                  <AutoTextEllipsis >{text}</AutoTextEllipsis>
                </Link>
              }
            />
          );
        },
        sorter: (a, b) => sorter.string(a, b, "index"),
      },
      {
        title: "Shard",
        dataIndex: "shard",
        render: (text, record) => {
          if (!record.shard_id) {
            return text;
          }
          return (
            <Link
              to={`/cluster/monitor/${clusterID}/indices/${
                record?.index
              }?_g={"timeRange":${encodeURIComponent(JSON.stringify(
                timeRange
              ))},"timeInterval":"${bucketSize}","cluster_name":"${clusterName}"}&shard_id=${
                record.shard_id
              }`}
            >
              {text}
            </Link>
          );
        },
        sorter: (a, b) => a?.shard - b?.shard,
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
        sorter: (a, b) => sorter.string(a, b, "prirep"),
      },
      {
        title: "State",
        dataIndex: "state",
        sorter: (a, b) => sorter.string(a, b, "state"),
      },
      {
        title: "Docs",
        dataIndex: "docs",
        render: (text, record) => (
          <span>{formatter.number(record?.docs || 0)}</span>
        ),
        sorter: (a, b) => a?.docs - b?.docs,
      },
      {
        title: "Store",
        dataIndex: "store_size_bytes",
        render: (text, record) => (
          <span>{formatter.bytes(record?.store_in_bytes || 0)}</span>
        ),
        sorter: (a, b) => a?.store_in_bytes - b?.store_in_bytes,
      },
      {
        title: "Indexing Rate",
        dataIndex: "index_qps",
        render: (text, record) => (
          <span>{text != null ? `${text} /s` : "N/A"}</span>
        ),
        sorter: (a, b) => a?.index_qps - b?.index_qps,
      },
      {
        title: "Indexing Bytes",
        dataIndex: "index_bytes_qps",
        render: (text, record) => (
          <span>
            {text != null ? `${formatter.bytes(text || 0)} /s` : "N/A"}
          </span>
        ),
        sorter: (a, b) => a?.index_bytes_qps - b?.index_bytes_qps,
      },
    ];
    return [columns];
  }, [timeRange]);

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
    </>
  );
};
