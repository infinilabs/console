import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { Button, Dropdown, Icon, Menu, message, Modal } from "antd";
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

export default (props) => {
  const ref = useRef(null);
  const [isLoading, setIsLoading] = React.useState();

  const clusterID = "infini_default_system_cluster";
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
      payload: {
        id: id,
      },
    }).then((result) => {
      if (result?.result == "deleted") {
        message.success(
          formatMessage({
            id: "app.message.delete.success",
          })
        );
        setIsLoading(true);
        setTimeout(() => {
          ref.current?.refresh();
        }, 1000);
      } else {
        console.log("delete failed:", result);
        message.success(
          formatMessage({
            id: "app.message.delete.failed",
          })
        );
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
    setIsLoading(true)
    const res = await request(`${ESPrefix}/metadata/${type}`, {
        method: 'DELETE'
    })
    if (res?.acknowledged) {
        message.success(formatMessage({ id: "app.message.operate.success"}))
    }
    setIsLoading(false)
  }

  const showCleanConfirm = (type) => {
    let title
    if (type === 'node') {
      title = formatMessage({ id: "form.button.clean.unavailable.nodes.desc" })
    } else  if (type === 'index') {
      title = formatMessage({ id: "form.button.clean.unavailable.indices.desc" })
    }
    Modal.confirm({
      title,
      onOk() {
        onClean(type)
      },
    });
  };

  const formatTableData = async (value) => {
    let dataNew = formatESSearchResult(value);
    //更新扩展数据
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
      key: "distribution",
      aggregable: true,
      visible: false,
    },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.name",
      }),
      key: "name",
      sortable: true,
      searchable: true,
      render: (text, record) => {
        return (
          <ClusterName
            name={text}
            distribution={record.distribution}
            id={record.id}
          />
        );
      },
    },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.health",
      }),
      key: "labels.health_status",
      sortable: true,
      searchable: true,
      aggregable: true,
      render: (text, record) => {
        return <HealthStatusView status={text} />;
      },
    },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.version",
      }),
      key: "version",
      sortable: true,
      searchable: true,
      aggregable: true,
    },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.node_count",
      }),
      key: "number_of_nodes",
    },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.endpoint",
      }),
      key: "endpoint",
      sortable: true,
      searchable: true,
    },

    {
      title: formatMessage({
        id: "cluster.manage.table.column.monitored",
      }),
      key: "monitored",
      sortable: true,
      render: (text, record) => {
        return formatMessage({
          id: text
            ? "cluster.manage.monitored.on"
            : "cluster.manage.monitored.off",
        });
      },
    },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.discovery.enabled",
      }),
      sortable: true,
      key: "discovery.enabled",
      render: (text, record) => {
        return formatMessage({
          id: text
            ? "cluster.manage.monitored.on"
            : "cluster.manage.monitored.off",
        });
      },
    },
    {
      title: formatMessage({
        id: "cluster.regist.step.connect.label.auth",
      }),
      key: "credential_id",
      // aggregable: true,
      render: (text, record) => {
        return record.credential_id || record?.basic_auth?.username
          ? formatMessage({ id: "cluster.regist.step.complete.tls.yes" })
          : formatMessage({ id: "cluster.regist.step.complete.tls.no" });
      },
    },
    {
      title: formatMessage({
        id: "table.field.actions",
      }),
      align: "center",
      render: (text, record) => {
        const onMenuClick = ({ key }) => {
          switch (key) {
            case "clean_nodes":
              showCleanConfirm('node');
              break;
            case "clean_indices":
              showCleanConfirm('index');
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
                onClick={() => {
                  onEditClick(record);
                }}
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
            {menuItems.map((item) => {
              return <Menu.Item key={item.key}>{item.content}</Menu.Item>;
            })}
          </Menu>
        );
        return (
          <div>
            <Dropdown overlay={menu}>
              <a
                style={{ fontSize: "20px" }}
                onClick={(e) => e.preventDefault()}
              >
                <Icon type="ellipsis" />
              </a>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  if (!hasAuthority("system.cluster:all")) {
    columns.splice(columns.length - 1)
  }

  return (
    <PageHeaderWrapper>
      <ListView
        ref={ref}
        clusterID={clusterID}
        collectionName={collectionName}
        columns={columns}
        formatDataSource={(value) => {
          return formatTableData(value);
        }}
        defaultQueryParams={{
          from: 0,
          size: 20,
        }}
        sortEnable={true}
        sideEnable={true}
        sideVisible={false}
        sidePlacement="left"
        headerToobarExtra={{
          getExtra: (props) => [
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
    </PageHeaderWrapper>
  );
};
