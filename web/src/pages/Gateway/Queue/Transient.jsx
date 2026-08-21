import {
  Card,
  Table,
  Popconfirm,
  Row,
  Col,
  Button,
  Input,
  message,
  Icon,
  Tooltip,
  Dropdown,
  Menu,
} from "antd";
import { formatMessage } from "umi/locale";
import { useCallback, useMemo, useState } from "react";
import request from "@/utils/request";
import { encodeProxyPath } from "@/lib/util";
import { filterSearchValue, sorter } from "@/utils/utils";
import { hasAuthority } from "@/utils/authority";
import IconText from "@/components/infini/IconText";
import QueueTypeIcon from "./QueueTypeIcon";

import SearchInput from "@/components/infini/SearchInput";

export default (props) => {
  const {
    loading,
    instanceID,
    queueData,
    onRefresh,
    handleMessageList,
  } = props;

  const [dataSource, setDataSource] = useState({
    data: queueData?.data || [],
    total: queueData?.total || 0,
  });
  const [searchValue, setSearchValue] = React.useState("");
  const initialQueryParams = {
    from: 0,
    size: 20,
  };

  function reducer(queryParams, action) {
    switch (action.type) {
      case "pagination":
        return {
          ...queryParams,
          from: (action.value - 1) * queryParams.size,
        };
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

  const defaultSelectedRows = {
    rowKeys: [],
    rows: [],
  };
  const [selectedRows, setSelectedRows] = useState(defaultSelectedRows);
  const onSelectChange = (selectedRowKeys, selectedRows) => {
    let rows = selectedRows.map((item) => {
      return {
        id: item.id,
      };
    });
    setSelectedRows({ rowKeys: selectedRowKeys, rows: rows });
  };
  const clearSelectedRows = () => {
    setSelectedRows(defaultSelectedRows);
  };
  const rowSelection = {
    selectedRowKeys: selectedRows.rowKeys,
    onChange: onSelectChange,
  };

  const columns = [
    {
      title: formatMessage({ id: "table.field.name" }),
      dataIndex: "name",
      render: (name, row) => (
        <IconText
          text={
            <Tooltip
              overlayStyle={{ maxWidth: "none"}}
              title={`${formatMessage({ id: "table.field.id" })}: ${row?.metadata?.id}`}
            >
              <a
                onClick={() => {
                  handleMessageList(row?.metadata?.id);
                }}
              >
                {name}
              </a>
            </Tooltip>
          }
          icon={<QueueTypeIcon queue_type={row?.queue_type} />}
        />
      ),
      sorter: (a, b) => sorter.string(a, b, "name"),
    },
    {
      title: formatMessage({ id: "gateway.queue.field.local_storage" }),
      dataIndex: "storage.local_usage",
      sorter: (a, b) =>
        a.storage.local_usage_in_bytes - b.storage.local_usage_in_bytes,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: formatMessage({ id: "gateway.queue.field.depth" }),
      dataIndex: "depth",
      sorter: (a, b) => a.depth - b.depth,
      sortDirections: ["descend", "ascend"],
      defaultSortOrder: "descend",
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      key: "action",
      width: 150,
      render: (text, record) => (
        <span>
          {hasAuthority("gateway.instance:all") ? (
            <>
              <Popconfirm
                title={formatMessage({ id: "app.message.confirm.delete" })}
                onConfirm={() => onDeleteClick([record.metadata.id])}
              >
                <a>{formatMessage({ id: "form.button.delete" })}</a>
              </Popconfirm>
            </>
          ) : null}
        </span>
      ),
    },
  ];

  const onDeleteClick = useCallback(async (ids) => {
    let respSuccessCount = 0;
    let respFailedCount = 0;
    for (let i = 0; i < ids.length; i++) {
      let queueID = ids[i];
      let path = encodeProxyPath(`/queue/${queueID}`);
      const resp = await request(
        `/instance/${instanceID}/_proxy?method=DELETE&path=${path}`,
        {
          method: "POST",
        }
      );
      // let resp = { acknowledged: true };//mock response
      if (resp && resp.acknowledged) {
        respSuccessCount++;
      } else {
        console.log("Delete queues failed, ", resp);

        let respSuccessCountText = "";
        if (respSuccessCount > 0) {
          respSuccessCountText = formatMessage(
            { id: "gateway.queue.message.partial_success" },
            { count: respSuccessCount }
          );
        }
        message.error(
          formatMessage(
            { id: "gateway.queue.delete.error" },
            {
              detail: respSuccessCount > 0 ? ` ${respSuccessCountText}` : "",
            }
          )
        );
        break;
      }
    }

    if (respSuccessCount > 0) {
      message.success(
        formatMessage(
          { id: "gateway.queue.delete.success" },
          { count: respSuccessCount }
        )
      );
      clearSelectedRows();
      setTimeout(() => {
        onRefresh();
      }, 1000);
    }
  }, []);

  const handleBatchMenuClick = ({ key }) => {
    if (selectedRows.rowKeys.length == 0) {
      message.warn(
        formatMessage({
          id: "app.message.warning.table.select-row",
        })
      );
      return;
    }
    switch (key) {
      case "delete_queue":
        onDeleteClick(selectedRows.rowKeys);
        break;
    }
  };

  const batchMenu = (
    <Menu onClick={handleBatchMenuClick}>
      <Menu.Item key="delete_queue">
        <Icon type="delete" />
        {formatMessage({ id: "gateway.queue.batch.delete_queues" })}
      </Menu.Item>
    </Menu>
  );

  useMemo(() => {
    let data = filterSearchValue(searchValue, queueData.data, ["name"]);
    const total = data.length;
    setDataSource({
      data,
      total,
    });
  }, [searchValue, queueData]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 15,
        }}
      >
        <div style={{ maxWidth: 500, flex: "1 1 auto" }}>
          <SearchInput
            allowClear
            placeholder={formatMessage({ id: "gateway.router.search.placeholder" })}
            enterButton={formatMessage({ id: "form.button.search" })}
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
          <Button icon="redo" onClick={onRefresh} style={{ marginLeft: 10 }}>
            {formatMessage({ id: "form.button.refresh" })}
          </Button>
          {hasAuthority("gateway.instance:all") ? (
            <Dropdown overlay={batchMenu}>
              <Button type="primary" icon="appstore">
                {formatMessage({ id: "form.button.batch_actions" })}
              </Button>
            </Dropdown>
          ) : null}
        </div>
      </div>
      <Table
        size={"small"}
        loading={loading}
        bordered
        dataSource={dataSource.data}
        rowKey={(row) => row?.metadata?.id}
        pagination={{
          size: "small",
          pageSize: queryParams.size,
          total: dataSource?.total,
          onChange: (page) => {
            dispatch({ type: "pagination", value: page });
          },
          showSizeChanger: true,
          onShowSizeChange: (_, size) => {
            dispatch({ type: "pageSizeChange", value: size });
          },
          showTotal: (total, range) =>
            formatMessage(
              { id: "gateway.router.pagination.total" },
              { start: range[0], end: range[1], total }
            ),
        }}
        columns={columns}
        rowSelection={rowSelection}
      />
    </div>
  );
};
