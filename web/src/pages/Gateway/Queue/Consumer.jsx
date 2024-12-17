import {
  Table,
  Popconfirm,
  Row,
  Col,
  Button,
  Input,
  message,
  Icon,
  Tooltip,
  Divider,
} from "antd";
import { formatMessage } from "umi/locale";
import { useCallback, useMemo, useState } from "react";
import request from "@/utils/request";
import { formatUtcTimeToLocal } from "@/utils/utils";
import ReestOffsetModal from "./ResetOffsetModal";
import { encodeProxyPath } from "@/lib/util";
import { filterSearchValue, sorter } from "@/utils/utils";
import { hasAuthority } from "@/utils/authority";
import AutoTextEllipsis from "@/components/AutoTextEllipsis";
import commonStyles from "@/common.less"

const { Search } = Input;

export default (props) => {
  const {
    instanceID,
    queueID,
    data = [],
    onRefresh,
    consumerSelectedRows,
    setConsumerSelectedRows,
  } = props;

  const [resetOffsetData, setResetOffsetData] = React.useState({});
  const showResetOffsetModal = (queueID, record) => {
    setResetOffsetData({
      ...resetOffsetData,
      visible: true,
      queue_id: queueID,
      record: record,
    });
  };

  const columns = [
    { 
      title: "Group", 
      dataIndex: "group", 
      render: (text) => <AutoTextEllipsis >{text}</AutoTextEllipsis>,
      className: commonStyles.maxColumnWidth
    },
    { 
      title: "LastActive", 
      dataIndex: "last_active",
      sortable: true,
      render: (text, record) => (
        <span title={text}>{formatUtcTimeToLocal(text)}</span>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text, record) => (
        <Tooltip title={`ID:${record?.id}`}>{text}</Tooltip>
      ),
    },
    { title: "Offset", dataIndex: "offset" },
    { title: "Source", dataIndex: "source" },
    {
      title: formatMessage({ id: "table.field.actions" }),
      key: "action",
      render: (text, record) => (
        <span>
          {hasAuthority("gateway.instance:all") ? (
            <>
              <a onClick={() => showResetOffsetModal(queueID, record)}>
                Reset Offset
              </a>
              <Divider key="d3" type="vertical" />
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => onConsumerDelete([record.id])}
              >
                <a>{formatMessage({ id: "form.button.delete" })}</a>
              </Popconfirm>
            </>
          ) : null}
        </span>
      ),
    },
  ];

  const onConsumerDelete = useCallback(async (ids) => {
    let respSuccessCount = 0;
    let respFailedCount = 0;
    for (let i = 0; i < ids.length; i++) {
      let consumerID = ids[i];
      let path = encodeProxyPath(`/queue/${queueID}/consumer/${consumerID}`);
      const resp = await request(
        `/instance/${instanceID}/_proxy?method=DELETE&path=${path}`,
        {
          method: "POST",
        }
      );
      // let resp = { result: "ok" };//mock response
      if (resp && resp.result == "ok") {
        respSuccessCount++;
      } else {
        console.log("Delete consumers failed, ", resp);

        let respSuccessCountText = "";
        if (respSuccessCount > 0) {
          respSuccessCountText = `Success: ${respSuccessCount}`;
        }
        message.error(
          `Delete consumers failed; ${
            respSuccessCount > 0 ? respSuccessCountText : ""
          }`
        );
        break;
      }
    }

    if (respSuccessCount > 0) {
      message.success(`Deleted ${respSuccessCount} consumers successfully`);
      //clear select state
      clearSelectedRows();
      setTimeout(() => {
        onRefresh();
      }, 1000);
    }
  }, [instanceID, queueID])

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
    if (selectedRowKeys.length > 0) {
      consumerSelectedRows[queueID] = selectedRowKeys;
    } else {
      delete consumerSelectedRows[queueID];
    }
    setConsumerSelectedRows(consumerSelectedRows);
  };
  const clearSelectedRows = () => {
    setSelectedRows(defaultSelectedRows);
  };
  const rowSelection = {
    selectedRowKeys: selectedRows.rowKeys,
    onChange: onSelectChange,
  };

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
      case "delete":
        onConsumerDelete(selectedRows.rowKeys);
        break;
    }
  };
  return (
    <>
      <Table
        size={"small"}
        columns={columns}
        dataSource={data}
        rowKey={(row) => row?.id}
        title={() => <span style={{ fontWeight: "bold" }}>Consumers</span>}
        rowSelection={rowSelection}
      />
      <ReestOffsetModal
        resetOffsetData={resetOffsetData}
        setResetOffsetData={setResetOffsetData}
        handleRefresh={onRefresh}
        gateway_instance_id={instanceID}
      />
    </>
  );
};
