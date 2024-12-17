import { Table, Tag, Input, Button, Icon, Tooltip } from "antd";
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
import commonStyles from "@/common.less"

const { Search } = Input;

export default ({
  clusterID,
  clusterName,
  indexName,
  timeRange,
  bucketSize,
}) => {
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

  const [columns] = React.useMemo(() => {
    let columns = [
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
        title: "IP",
        dataIndex: "ip",
        sorter: (a, b) => sorter.string(a, b, "ip"),
      },
      {
        title: "Node",
        dataIndex: "node",
        render: (text, record) => {
          if (!text) {
            return text;
          }
          return (
            <IconText
              icon={<Icon type="database" />}
              text={
                <Link
                  to={`/cluster/monitor/${clusterID}/nodes/${
                    record?.id
                  }?_g={"timeRange":${encodeURIComponent(JSON.stringify(
                    timeRange
                  ))},"timeInterval":"${bucketSize}","cluster_name":"${clusterName}","node_name":"${
                    record?.node
                  }"}`}
                >
                  <AutoTextEllipsis >{text}</AutoTextEllipsis>
                </Link>
              }
            />
          );
        },
        sorter: (a, b) => sorter.string(a, b, "node"),
        className: commonStyles.maxColumnWidth
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
        scroll={{x: 'max-content' }}
      />
    </>
  );
};
