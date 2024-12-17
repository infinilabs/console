import {
  Card,
  Table,
  Popconfirm,
  Row,
  Col,
  Button,
  Input,
  message,
  Popover,
  Icon,
  Tooltip,
  Dropdown,
  Menu,
} from "antd";
import { formatMessage } from "umi/locale";
import { useCallback, useMemo, useState } from "react";
import request from "@/utils/request";
import { Editor } from "@/components/monaco-editor";
import { encodeProxyPath } from "@/lib/util";
import { filterSearchValue, sorter } from "@/utils/utils";
import { hasAuthority } from "@/utils/authority";
import IconText from "@/components/infini/IconText";
import Consumer from "./Consumer";
import QueueTypeIcon from "./QueueTypeIcon";
import AutoTextEllipsis from "@/components/AutoTextEllipsis";
import commonStyles from "@/common.less"

const { Search } = Input;

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
      case "refresh":
        return {
          ...queryParams,
        };
      default:
        throw new Error();
    }
  }
  const [queryParams, dispatch] = React.useReducer(reducer, initialQueryParams);

  const [queueSelectedRows, setQueueSelectedRows] = useState({});
  const [consumerSelectedRows, setConsumerSelectedRows] = useState({});
  const defaultSelectedRows = {
    rowKeys: [],
    rows: [],
  };
  const [selectedRows, setSelectedRows] = useState(defaultSelectedRows);
  const onSelectChange = (selectedRowKeys, selectedRows) => {
    let queueSelectedRowsNew = queueSelectedRows;
    let rows = selectedRows.map((item) => {
      let queueID = item.metadata.id;
      queueSelectedRowsNew[queueID] = item.consumers.map((subItem) => {
        return subItem.id;
      });
      return {
        id: queueID,
      };
    });
    setQueueSelectedRows(queueSelectedRowsNew);
    setSelectedRows({ rowKeys: selectedRowKeys, rows: rows });
  };
  const clearSelectedRows = () => {
    setSelectedRows(defaultSelectedRows);
    setQueueSelectedRows({});
  };
  const rowSelection = {
    selectedRowKeys: selectedRows.rowKeys,
    onChange: onSelectChange,
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (name, row) => (
        <>
          <IconText
            text={
              <Popover
                content={consumerLabelRender(row?.metadata?.label)}
                title={(
                  <>
                    <div>{`ID: ${row?.metadata?.id}`}</div>
                    <div>{`Name: ${name}`}</div>
                  </>
                )}
              >
                <a
                  onClick={() => {
                    handleMessageList(
                      row?.metadata?.id,
                      row?.earliest_consumer_offset
                    );
                  }}
                >
                  <AutoTextEllipsis showTooltip={false}>{name}</AutoTextEllipsis>
                </a>
              </Popover>
            }
            icon={<QueueTypeIcon queue_type={row?.queue_type} />}
          />
        </>
      ),
      sorter: (a, b) => sorter.string(a, b, "name"),
      className: commonStyles.maxColumnWidth
    },
    {
      title: "Local Storage",
      dataIndex: "storage.local_usage",
      sorter: (a, b) =>
        a.storage.local_usage_in_bytes - b.storage.local_usage_in_bytes,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Produce Offset",
      dataIndex: "offset",
      sorter: (a, b) => a.offset - b.offset,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Consume Offset (earliest)",
      dataIndex: "earliest_consumer_offset",
      sorter: (a, b) => a.earliest_consumer_offset - b.earliest_consumer_offset,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Synchronization (latest_segment)",
      dataIndex: "synchronization.latest_segment",
      sorter: (a, b) =>
        a.synchronization.latest_segment - b.synchronization.latest_segment,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Total Messages",
      dataIndex: "messages",
      sorter: (a, b) => a.messages - b.messages,
      sortDirections: ["descend", "ascend"],
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
                title="Sure to delete?"
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

  const consumerLabelRender = (label) => {
    let labelObj = typeof label == "object" ? label : {};
    return (
      <Editor
        height="200px"
        width="400px"
        language="json"
        theme="light"
        value={JSON.stringify(labelObj, null, 2)}
        options={{
          minimap: {
            enabled: false,
          },
          wordBasedSuggestions: true,
        }}
      />
    );
  };

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
        console.log("Delete queue failed, ", resp);

        let respSuccessCountText = "";
        if (respSuccessCount > 0) {
          respSuccessCountText = `Success: ${respSuccessCount}`;
        }
        message.error(
          `Delete queue failed; ${
            respSuccessCount > 0 ? respSuccessCountText : ""
          }`
        );
        break;
      }
    }

    if (respSuccessCount > 0) {
      message.success(`Deleted ${respSuccessCount} queues successfully`);
      //clear select state
      clearSelectedRows();
      setTimeout(() => {
        onRefresh();
      }, 1000);
    }
  }, []);

  const onConsumerDelete = async () => {
    let consumerRows = consumerSelectedRows;
    if (Object.keys(queueSelectedRows).length > 0) {
      consumerRows = { ...consumerRows, ...queueSelectedRows };
    }
    const keys = Object.keys(consumerRows);
    if (keys.length === 0) return;
    const promises = keys
      .map((queueID) =>
        consumerRows[queueID]
          .map((consumerID) => {
            const path = encodeProxyPath(
              `/queue/${queueID}/consumer/${consumerID}`
            );
            return request(
              `/instance/${instanceID}/_proxy?method=DELETE&path=${path}`,
              {
                method: "POST",
              }
            );
          })
          .filter((item) => !!item)
      )
      .flat(Infinity);
    if (promises.length > 0) {
      try {
        message.success(`Deleted ${promises.length} consumers successfully`);
        await Promise.all(promises);

        //clear select state
        setConsumerSelectedRows({});
        clearSelectedRows();

        setTimeout(() => {
          onRefresh();
        }, 1000);
      } catch (e) {
        console.log(
          "onConsumerDelete consumerSelectedRows:",
          consumerSelectedRows
        );
        console.log("onConsumerDelete error:", e);
        message.error(`Delete failed`);
      }
    }
  };

  const handleBatchMenuClick = ({ key }) => {
    switch (key) {
      case "delete_queue":
        if (selectedRows.rowKeys.length == 0) {
          message.warn(
            formatMessage({
              id: "app.message.warning.table.select-row",
            })
          );
          return;
        }
        onDeleteClick(selectedRows.rowKeys);
        break;
      case "delete_consumer":
        if (
          Object.keys(consumerSelectedRows).length == 0 &&
          selectedRows.rowKeys.length == 0
        ) {
          message.warn(
            formatMessage({
              id: "app.message.warning.table.select-row",
            })
          );
          return;
        }
        onConsumerDelete();
        break;
    }
  };

  const batchMenu = (
    <Menu onClick={handleBatchMenuClick}>
      <Menu.Item key="delete_queue">
        <Icon type="delete" />
        {formatMessage({ id: "form.button.delete" })} Queues
      </Menu.Item>
      <Menu.Item key="delete_consumer">
        <Icon type="delete" />
        {formatMessage({ id: "form.button.delete" })} Consumers
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
          <Search
            allowClear
            placeholder="Type keyword to search"
            enterButton="Search"
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
              <Button type="primary">
                {formatMessage({ id: "form.button.batch_actions" })}{" "}
                <Icon type="down" />
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
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        columns={columns}
        rowSelection={rowSelection}
        expandedRowRender={(row) => (
          <span style={{ margin: 0 }}>
            <Consumer
              instanceID={instanceID}
              data={row?.consumers || []}
              queueID={row?.metadata?.id}
              onRefresh={onRefresh}
              setConsumerSelectedRows={setConsumerSelectedRows}
              consumerSelectedRows={consumerSelectedRows}
            />
          </span>
        )}
        rowClassName={(record, index) => {
          return record.earliest_consumer_offset &&
            record.offset == record.earliest_consumer_offset
            ? "offset-normal"
            : "";
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};
