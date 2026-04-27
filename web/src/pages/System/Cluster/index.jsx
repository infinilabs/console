import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { Button, Dropdown, Icon, Menu, message, Modal, Tooltip } from "antd";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  Fragment,
} from "react";
import { formatMessage } from "umi/locale";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { HealthStatusView } from "@/components/infini/health_status_view";
import ClusterName from "./components/ClusterName";
import ListView from "@/components/ListView";
import router from "umi/router";
import Link from "umi/link";
import request from "@/utils/request";
import { hasAuthority } from "@/utils/authority";
import { useGlobal } from "@/layouts/GlobalContext";
import { ESPrefix } from "@/services/common";
import { getSystemClusterID } from "@/utils/setup";

// 统一的省略 + Tooltip 渲染
const renderWithTooltip = (text) => (
  <Tooltip title={text} placement="topLeft">
    <span
      style={{
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  </Tooltip>
);

// 让所有列表头不换行
const noWrapHeaderCell = () => ({ style: { whiteSpace: "nowrap" } });

export default (props) => {
  const ref = useRef(null);
  const [isLoading, setIsLoading] = React.useState();

  const clusterID = getSystemClusterID();
  const collectionName = "cluster";
  const { clusterStatus, dispatch } = useGlobal();

  const onNewClick = useCallback(async () => {
    dispatch({
      type: "clusterConfig/saveData",
      payload: {
        editMode: "NEW",
        editValue: { basic_auth: {} },
      },
    });
  }, []);

  const onEditClick = useCallback(async (record) => {
    dispatch({
      type: "clusterConfig/saveData",
      payload: {
        editMode: "UPDATE",
        editValue: record,
      },
    });
  }, []);

  const onDeleteClick = useCallback(async (id) => {
    return dispatch({
      type: "clusterConfig/deleteCluster",
      payload: { id },
    }).then((result) => {
      if (result?.result === "deleted") {
        message.success(formatMessage({ id: "app.message.delete.success" }));
        setIsLoading(true);
        setTimeout(() => {
          ref.current?.refresh();
        }, 1000);
      } else {
        console.log("delete failed:", result);
        message.error(formatMessage({ id: "app.message.delete.failed" }));
      }
    });
  }, []);

  const showDeleteConfirm = useCallback((record) => {
    Modal.confirm({
      title: "Are you sure delete this item?",
      content: (
        <>
          <div>Cluster: {record.name}</div>
          <div>Version: {record.version}</div>
          <div>Endpoint: {record.endpoint}</div>
        </>
      ),
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        onDeleteClick(record.id);
      },
    });
  }, []);

  const onClean = async (type) => {
    setIsLoading(true);
    const res = await request(`${ESPrefix}/metadata/${type}`, {
      method: "DELETE",
    });
    if (res?.acknowledged) {
      message.success(formatMessage({ id: "app.message.operate.success" }));
    }
    setIsLoading(false);
  };

  const showCleanConfirm = (type) => {
    const titleId =
      type === "node"
        ? "form.button.clean.unavailable.nodes.desc"
        : "form.button.clean.deleted.indices.desc";
    Modal.confirm({
      title: formatMessage({ id: titleId }),
      onOk() {
        onClean(type);
      },
    });
  };

  const formatTableData = async (value) => {
    let dataNew = formatESSearchResult(value);
    let tableData = dataNew?.data?.map((item) => {
      item.number_of_nodes =
        clusterStatus?.[item.id]?.health?.number_of_nodes || 0;
      return item;
    });
    dataNew.data = tableData;
    return dataNew;
  };

  const columns = [
    {
      title: "Distribution",
      width: 150,
      key: "distribution",
      aggregable: true,
      visible: false,
      onHeaderCell: noWrapHeaderCell,
    },
    {
      title: formatMessage({ id: "cluster.manage.table.column.name" }),
      key: "name",
      width: 180,
      sortable: true,
      searchable: true,
      onHeaderCell: noWrapHeaderCell,
      render: (text, record) => (
        <Tooltip title={text} placement="topLeft">
          <div
            style={{
              width: "100%",
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <ClusterName
              name={text}
              distribution={record.distribution}
              id={record.id}
            />
          </div>
        </Tooltip>
      ),
    },
    {
      title: formatMessage({ id: "cluster.manage.table.column.health" }),
      width: 100,
      key: "labels.health_status",
      sortable: true,
      searchable: true,
      aggregable: true,
      onHeaderCell: noWrapHeaderCell,
      render: (text) => <HealthStatusView status={text} />,
    },
    {
      title: formatMessage({ id: "cluster.manage.table.column.version" }),
      width: 100,
      key: "version",
      sortable: true,
      searchable: true,
      aggregable: true,
      ellipsis: true,
      onHeaderCell: noWrapHeaderCell,
      render: renderWithTooltip,
    },
    {
      title: formatMessage({ id: "cluster.manage.table.column.node_count" }),
      width: 80,
      key: "number_of_nodes",
      onHeaderCell: noWrapHeaderCell,
    },
    {
      title: formatMessage({ id: "cluster.manage.table.column.endpoint" }),
      key: "endpoint",
      width: 200,
      sortable: true,
      searchable: true,
      ellipsis: true,
      onHeaderCell: noWrapHeaderCell,
      render: renderWithTooltip,
    },
    {
      title: formatMessage({ id: "cluster.manage.table.column.monitored" }),
      width: 120,
      key: "monitored",
      sortable: true,
      onHeaderCell: noWrapHeaderCell,
      render: (text) =>
        formatMessage({
          id: text ? "cluster.manage.monitored.on" : "cluster.manage.monitored.off",
        }),
    },
    {
      title: formatMessage({ id: "cluster.manage.table.column.monitor_mode" }),
      width: 150,
      key: "metric_collection_mode",
      sortable: false,
      onHeaderCell: noWrapHeaderCell,
      render: (text) =>
        formatMessage({
          id:
            text === "agent"
              ? "cluster.manage.metric_collection_mode.option.agent"
              : "cluster.manage.metric_collection_mode.option.agentless",
        }),
    },
    {
      title: formatMessage({ id: "cluster.manage.table.column.discovery.enabled" }),
      width: 150,
      sortable: true,
      key: "discovery.enabled",
      onHeaderCell: noWrapHeaderCell,
      render: (text) =>
        formatMessage({
          id: text ? "cluster.manage.monitored.on" : "cluster.manage.monitored.off",
        }),
    },
    {
      title: formatMessage({ id: "cluster.regist.step.connect.label.auth" }),
      width: 120,
      key: "credential_id",
      onHeaderCell: noWrapHeaderCell,
      render: (text, record) =>
        record.credential_id || record?.basic_auth?.username
          ? formatMessage({ id: "cluster.regist.step.complete.tls.yes" })
          : formatMessage({ id: "cluster.regist.step.complete.tls.no" }),
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      width: 80,
      align: "center",
      fixed: "right", // 操作列固定在右侧，不随横向滚动消失
      onHeaderCell: noWrapHeaderCell,
      render: (text, record) => {
        const onMenuClick = ({ key }) => {
          switch (key) {
            case "clean_nodes":
              showCleanConfirm("node");
              break;
            case "clean_indices":
              showCleanConfirm("index");
              break;
            case "delete":
              showDeleteConfirm(record);
              break;
          }
        };

        const menuItems = [];
        if (hasAuthority("system.cluster:all")) {
          menuItems.push({
            key: "edit",
            content: (
              <Link
                to={`/resource/cluster/${record.id}/edit`}
                onClick={() => onEditClick(record)}
              >
                {formatMessage({ id: "form.button.edit" })}
              </Link>
            ),
          });
          menuItems.push({
            key: "clean_nodes",
            content: formatMessage({ id: "form.button.clean.unavailable.nodes" }),
          });
          menuItems.push({
            key: "clean_indices",
            content: formatMessage({ id: "form.button.clean.deleted.indices" }),
          });
          if (!record.reserved) {
            menuItems.push({
              key: "delete",
              content: <a>{formatMessage({ id: "form.button.delete" })}</a>,
            });
          }
        }

        const menu = (
          <Menu onClick={onMenuClick}>
            {menuItems.map((item) => (
              <Menu.Item key={item.key}>{item.content}</Menu.Item>
            ))}
          </Menu>
        );

        return (
          <Dropdown overlay={menu}>
            <a style={{ fontSize: "20px" }} onClick={(e) => e.preventDefault()}>
              <Icon type="ellipsis" />
            </a>
          </Dropdown>
        );
      },
    },
  ];

  if (!hasAuthority("system.cluster:all")) {
    columns.splice(columns.length - 1);
  }

  return (
    <PageHeaderWrapper>
      <div style={{ overflowX: "auto", width: "100%" }}>
        <ListView
          ref={ref}
          clusterID={clusterID}
          collectionName={collectionName}
          columns={columns}
          formatDataSource={(value) => formatTableData(value)}
          defaultQueryParams={{ from: 0, size: 20 }}
          sortEnable={true}
          sideEnable={true}
          sideVisible={false}
          sidePlacement="left"
          scroll={{ x: "max-content" }} // 超出横向滚动，避免撑破布局
          headerToobarExtra={{
            getExtra: () => [
              hasAuthority("system.cluster:all") ? (
                <Link to="/resource/cluster/regist" onClick={onNewClick}>
                  <Button type="primary" icon="plus">
                    {formatMessage({ id: "gateway.instance.btn.new" })}
                  </Button>
                </Link>
              ) : null,
            ],
          }}
        />
      </div>
    </PageHeaderWrapper>
  );
};