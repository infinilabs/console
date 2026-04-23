import { useMemo, useState } from "react";
import { Button, Card, Input, Table, Tag } from "antd";
import moment from "moment";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import useFetch from "@/lib/hooks/use_fetch";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { formatMessage } from "umi/locale";
import SearchInput from "@/components/infini/SearchInput";

const statusColorMap = {
  ready: "blue",
  running: "green",
  complete: "cyan",
  error: "red",
  stopped: "orange",
  pending_stop: "gold",
  init: "purple",
};

const getTotalValue = (total) => {
  if (typeof total === "number") {
    return total;
  }
  return total?.value || 0;
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }
  return moment(value).format("YYYY-MM-DD HH:mm:ss");
};

const TaskList = ({ apiPath, title }) => {
  const [queryParams, setQueryParams] = useState({
    size: 10,
    from: 0,
    current: 1,
    keyword: "",
  });

  const { loading, value } = useFetch(
    apiPath,
    {
      method: "GET",
      queryParams,
    },
    [queryParams]
  );

  const result = useMemo(() => {
    return formatESSearchResult(value);
  }, [value]);

  const dataSource = result?.data || [];
  const total = getTotalValue(result?.total);

  const columns = [
    {
      title: formatMessage({ id: "table.field.id", defaultMessage: "ID" }),
      dataIndex: "id",
      width: 280,
      render: (text) => {
        return (
          <div style={{ wordBreak: "break-all", lineHeight: 1.5 }}>{text}</div>
        );
      },
    },
    {
      title: formatMessage({ id: "table.field.description", defaultMessage: "Description" }),
      dataIndex: "description",
      render: (text) => text || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (text) => {
        const color = statusColorMap[text] || "default";
        return <Tag color={color}>{text || "-"}</Tag>;
      },
    },
    {
      title: "Type",
      dataIndex: ["metadata", "type"],
      width: 180,
      render: (text) => text || "-",
    },
    {
      title: "Created",
      dataIndex: "created",
      width: 180,
      render: (text) => formatDateTime(text),
    },
    {
      title: "Completed",
      dataIndex: "completed_time",
      width: 180,
      render: (text) => formatDateTime(text),
    },
  ];

  const onRefresh = () => {
    setQueryParams((params) => {
      return {
        ...params,
        ts: new Date().valueOf(),
      };
    });
  };

  const onSearch = (keyword) => {
    setQueryParams((params) => {
      return {
        ...params,
        keyword: keyword || "",
        from: 0,
        current: 1,
      };
    });
  };

  const handleTableChange = (pagination) => {
    const { current, pageSize } = pagination;
    setQueryParams((params) => {
      return {
        ...params,
        current,
        size: pageSize,
        from: (current - 1) * pageSize,
      };
    });
  };

  return (
    <PageHeaderWrapper title={title}>
      <Card
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <SearchInput
              allowClear
              placeholder="keyword"
              onSearch={onSearch}
              style={{ width: 240 }}
            />
            <Button icon="redo" onClick={onRefresh}>
              {formatMessage({ id: "form.button.refresh" })}
            </Button>
          </div>
        }
      >
        <Table
          rowKey="id"
          size="small"
          bordered
          loading={loading}
          dataSource={dataSource}
          columns={columns}
          pagination={{
            size: "small",
            current: queryParams.current,
            pageSize: queryParams.size,
            total,
            showSizeChanger: true,
            showTotal: (value, range) => `${range[0]}-${range[1]} of ${value} items`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </PageHeaderWrapper>
  );
};

export default TaskList;
