import { HealthStatusView } from "@/components/infini/health_status_view";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import {
  Button,
  Divider,
  Table,
  Drawer,
  Popconfirm,
  message,
  Tabs,
  Icon,
  Tooltip,
  InputNumber,
} from "antd";
import { useMemo, useState, useCallback, useRef } from "react";
import { Link } from "umi";
import { formatMessage } from "umi/locale";
import { Associate } from "./Associate";
import UnknownProcess from "./UnknownProcess";
import UnknownAssociate from "./UnknownAssociate";
import Content from "@/components/Overview/Detail/Content";
import Title from "@/components/Overview/Detail/Title";
import Metrics from "@/pages/Platform/Overview/Node/Detail/Metrics";
import Infos from "@/pages/Platform/Overview/Node/Detail/Infos";
import Logs from "@/pages/Platform/Overview/Node/Detail/Logs";
import IconText from "@/components/infini/IconText";
import { SearchEngineIcon } from "@/lib/search_engines";
import { hasAuthority } from "@/utils/authority";
import AutoTextEllipsis from "@/components/AutoTextEllipsis";
import commonStyles from "@/common.less"
import styles from "./RowDetail.less";

const { TabPane } = Tabs;

const detailTitleConfig = {
  getLabels: (item) => [
    item._source?.metadata?.cluster_name,
    item._source?.metadata?.node_name,
  ],
  getStatus: (item) => item._source?.metadata?.labels?.status || "unavailable",
};

export const AgentRowDetail = ({ agentID, t }) => {
  const [queryParams, setQueryParams] = useState({});
  const [btnLoading, setBtnLoading] = useState(false);
  const { loading, error, value } = useFetch(
    `/instance/${agentID}/node/_discovery`,
    {
      queryParams: { ...queryParams },
    },
    [queryParams, agentID, t]
  );

  const [dataSource, setDataSource] = useState({});
  useMemo(() => {
    setDataSource(value);
  }, [value]);

  const [nodes, unknownProcess] = useMemo(() => {
    let nodes = Object.keys(dataSource?.nodes || {}).map((uuid) => {
      let item = dataSource.nodes[uuid];
      item.id = uuid;
      return item;
    });
    let unknownProcess = dataSource?.unknown_process || [];
    return [nodes, unknownProcess];
  }, [dataSource]);

  const [state, setState] = useState({
    associateVisible: false,
    associateNode: {},
    nodeMetadata: {},
    nodeDetailVisible: false,
    processesTab: "elasticsearch",
    unknownAssociateVisible: false,
  });

  // intervalEdit: map of clusterID -> { editing: bool, value: number|null, loading: bool }
  const [intervalEdit, setIntervalEdit] = useState({});

  const onIntervalEdit = useCallback((clusterID, currentInterval) => {
    setIntervalEdit((prev) => ({
      ...prev,
      [clusterID]: { editing: true, value: currentInterval || null, loading: false },
    }));
  }, []);

  const onIntervalCancel = useCallback((clusterID) => {
    setIntervalEdit((prev) => {
      const next = { ...prev };
      delete next[clusterID];
      return next;
    });
  }, []);

  const onIntervalSave = useCallback(async (clusterID) => {
    const editState = intervalEdit[clusterID];
    if (!editState) return;
    const interval = editState.value == null ? 0 : editState.value;
    setIntervalEdit((prev) => ({
      ...prev,
      [clusterID]: { ...prev[clusterID], loading: true },
    }));
    const res = await request(`/instance/${agentID}/cluster/${clusterID}/_collection_interval`, {
      method: "POST",
      body: { collection_interval: interval },
    });
    setIntervalEdit((prev) => {
      const next = { ...prev };
      delete next[clusterID];
      return next;
    });
    if (res && res.acknowledged) {
      message.success(formatMessage({ id: "agent.instance.collection_interval.save.success" }));
      setQueryParams((st) => ({ ...st, t: new Date().valueOf() }));
    }
  }, [agentID, intervalEdit]);

  const details = useMemo(
    () => [
      {
        title: formatMessage({ id: "overview.detail.metrics" }),
        component: Metrics,
        key: "metrics",
      },
      {
        title: formatMessage({ id: "overview.detail.infos" }),
        component: Infos,
        key: "infos",
      },
      {
        title: formatMessage({ id: "cluster.monitor.tabs.logs" }),
        component: Logs,
        key: "logs",
      },
    ],
    [t]
  );

  const onDetailClick = async (node_uuid, cluster_id) => {
    const res = await request("/elasticsearch/node/_search", {
      method: "POST",
      body: { size: 10, keyword: node_uuid, search_field: "metadata.node_id" },
    });
    if (res && res.error) {
      return;
    }
    const target = res.hits.hits?.find(
      (item) => item._source.metadata?.cluster_id == cluster_id
    );
    if (target) {
      setState((st) => {
        return {
          ...st,
          nodeMetadata: target,
          nodeDetailVisible: true,
        };
      });
    }
  };

  const onDeleteClick = async (id, agentID) => {
    setBtnLoading(true);
    const res = await request(`/instance/${agentID}/_nodes`, {
      method: "DELETE",
      body: [id],
    });
    setBtnLoading(false);
    if (res && res.error) {
      console.log("onDeleteClick error:", res);
      return;
    }

    if (res?.acknowledged === true) {
      message.success(formatMessage({ id: "app.message.delete.success" }));
      setTimeout(() => {
        setQueryParams((st) => {
          return {
            ...st,
            t: new Date().valueOf(),
          };
        });
      }, 1000);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: formatMessage({ id: "overview.column.pid" }),
        width: 100,
        dataIndex: "node_info.process.id",
        render: (text) => <div className={styles.cellWrap}>{text}</div>,
      },
      {
        title: formatMessage({ id: "alert.email.manage.field.port" }),
        width: 100,
        dataIndex: "node_info.http.publish_address",
        render: (text, record) => {
          return <div className={styles.cellWrap}>{text?.split(":")?.[1]}</div>;
        },
      },
      {
        title: formatMessage({ id: "overview.column.cluster" }),
        width: 160,
        dataIndex: "cluster_info.cluster_name",
        render: (text, record) => {
          const content = record.cluster_id ? (
            <Link to={`/cluster/monitor/elasticsearch/${record.cluster_id}`}>
              {text}
            </Link>
          ) : text;

          return (
            <Tooltip title={text}>
              <div className={styles.cellWrap}>
                <div className={styles.cellIcon}>
                  <SearchEngineIcon
                    distribution={record.cluster_info.version.distribution}
                    width="16px"
                    height="16px"
                  />
                </div>
                <div className={styles.cellContent}>{content}</div>
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: formatMessage({ id: "overview.column.node" }),
        width: 160,
        dataIndex: "node_info.name",
        render: (text, record) => {
          const content = record.cluster_id ? (
            <Link
              to={`/cluster/monitor/${record.cluster_id}/nodes/${record.id}?_g={"cluster_name":"${record.cluster_info.cluster_name}","node_name":"${text}"}`}
            >
              {text}
            </Link>
          ) : (
            text
          );

          return (
            <Tooltip title={text}>
              <div className={styles.cellWrap}>
                <div className={styles.cellIcon}>
                  <Icon type="database" />
                </div>
                <div className={styles.cellContent}>{content}</div>
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: formatMessage({ id: "overview.column.homepath" }),
        dataIndex: "node_info.settings.path.home",
        render: (text) => (
          <div className={styles.cellWrap}>
            <AutoTextEllipsis>{text}</AutoTextEllipsis>
          </div>
        ),
        className: commonStyles.maxColumnWidth
      },
      {
        title: formatMessage({ id: "overview.column.status" }),
        dataIndex: "status",
        render: (text, record) => {
          const status = text == "online" ? "online" : "gray";
          const label =
            text === "online" || text === "Online"
              ? formatMessage({ id: "gateway.instance.status.online" })
              : text;
          return <HealthStatusView status={status} label={label} />;
        },
        width: 100,
      },
      {
        key: "collection_interval",
        title: (
          <Tooltip title={formatMessage({ id: "agent.instance.collection_interval.tip" })}>
            {formatMessage({ id: "agent.instance.collection_interval.label" })}
            {" "}<Icon type="question-circle-o" style={{ color: "#999" }} />
          </Tooltip>
        ),
        width: 160,
        render: (text, record) => {
          if (!record.enrolled) return null;
          const clusterID = record.cluster_id;
          if (!clusterID) return null;
          const edit = intervalEdit[clusterID];
          const currentInterval = record.collection_interval || 0;
          if (edit && edit.editing) {
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <InputNumber
                  size="small"
                  min={0}
                  max={3600}
                  style={{ width: 70 }}
                  value={edit.value}
                  placeholder={formatMessage({ id: "agent.instance.collection_interval.placeholder" })}
                  onChange={(val) => setIntervalEdit((prev) => ({
                    ...prev,
                    [clusterID]: { ...prev[clusterID], value: val },
                  }))}
                />
                <span style={{ color: "#999", fontSize: 12 }}>
                  {formatMessage({ id: "agent.instance.collection_interval.unit" })}
                </span>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0 }}
                  loading={edit.loading}
                  onClick={() => onIntervalSave(clusterID)}
                >
                  {formatMessage({ id: "form.button.save" })}
                </Button>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0 }}
                  onClick={() => onIntervalCancel(clusterID)}
                >
                  {formatMessage({ id: "form.button.cancel" })}
                </Button>
              </div>
            );
          }
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span>
                {currentInterval > 0
                  ? `${currentInterval} ${formatMessage({ id: "agent.instance.collection_interval.unit" })}`
                  : `10 ${formatMessage({ id: "agent.instance.collection_interval.unit" })}`}
              </span>
              {hasAuthority("agent.instance:all") && (
                <Icon
                  type="edit"
                  style={{ color: "#1890ff", cursor: "pointer", fontSize: 12 }}
                  onClick={() => onIntervalEdit(clusterID, currentInterval || null)}
                />
              )}
            </div>
          );
        },
      },
      {
        title: formatMessage({ id: "table.field.actions" }),
        width: 140,
        render: (text, record) => (
          <div className={styles.actionWrap}>
            {/* <Popconfirm
                title="Sure to delete?"
                onConfirm={() => onDeleteClick(record.id, agentID)}
              >
                <a>{formatMessage({ id: "form.button.delete" })}</a>
              </Popconfirm>
              <Divider key="d3" type="vertical" /> */}
            {record.enrolled ? (
              <>
                {
                  hasAuthority("agent.instance:all") && (
                    <>
                      <Popconfirm
                        title={formatMessage({
                          id: "agent.instance.revoke.confirm.title",
                        })}
                        onConfirm={() =>
                          onRevoke({
                            cluster_id: record.cluster_id,
                            cluster_uuid: record.cluster_info.cluster_uuid,
                            node_uuid: record.id,
                          })
                        }
                      >
                        <Button style={{ padding: 0, height: "auto" }} type="link" loading={btnLoading}>
                          {formatMessage({ id: "agent.instance.button.revoke" })}
                        </Button>
                      </Popconfirm>
                      <Divider key="d3" type="vertical" />
                    </>
                  )
                }
                <Button
                  style={{ padding: 0, height: "auto" }}
                  type="link"
                  onClick={() => {
                    onDetailClick(record.id, record.cluster_id);
                  }}
                >
                  {formatMessage({
                    id: "agent.instance.table.operation.detail",
                  })}
                </Button>
              </>
            ) : (
              <Button
                style={{ padding: 0, height: "auto" }}
                type="link"
                onClick={() => {
                  setState((st) => {
                    return {
                      ...st,
                      associateVisible: true,
                      associateNode: record,
                    };
                  });
                }}
                >
                  {formatMessage({
                    id: "agent.instance.table.operation.associate",
                  })}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [agentID, btnLoading, t, intervalEdit, onIntervalEdit, onIntervalSave, onIntervalCancel]
  );
  const onRefreshClick = async () => {
    setQueryParams((st) => {
      return {
        ...st,
        t: new Date().valueOf(),
      };
    });
  };
  const onEnroll = async (info) => {
    setBtnLoading(true);
    const res = await request(`/instance/${agentID}/node/_enroll`, {
      method: "POST",
      body: info,
    });
    setBtnLoading(false);
    if (res && !res.error) {
      message.success(formatMessage({ id: "app.message.operate.success" }));
    } else {
      console.log("onEnroll error:", res);
      return;
    }
    setState((st) => {
      return {
        ...st,
        associateVisible: false,
      };
    });
    setQueryParams((st) => {
      return {
        ...st,
        t: new Date().valueOf(),
      };
    });
  };

  const onUnknownProcessEnroll = async (clusters) => {
    const clusterItems = Array.isArray(clusters)
      ? clusters
          .map((item) =>
            typeof item === "string"
              ? { cluster_id: item }
              : item
          )
          .filter((item) => item?.cluster_id)
      : [];
    const clusterIDs = clusterItems.map((item) => item.cluster_id);
    if (clusterIDs.length === 0) {
      message.warn(
        formatMessage({ id: "agent.instance.associate.tips.associate" })
      );
      return;
    }
    const previousNodeCount = nodes.length;
    const previousUnknownCount = unknownProcess.length;
    setBtnLoading(true);
    const res = await request(`/instance/${agentID}/node/_discovery`, {
      method: "POST",
      body: {
        cluster_id: clusterIDs,
        clusters: clusterItems,
      },
    });
    setBtnLoading(false);
    if (res && !res.error) {
      const nextNodeCount = Object.keys(res.nodes || {}).length;
      const nextUnknownCount = Array.isArray(res.unknown_process)
        ? res.unknown_process.length
        : previousUnknownCount;
      const hasBoundNode =
        nextNodeCount > previousNodeCount ||
        nextUnknownCount < previousUnknownCount;
      if (res.nodes) {
        setDataSource({ ...res, t: Date.now() });
      }
      if (!hasBoundNode) {
        message.warning(
          formatMessage({ id: "agent.instance.associate.tips.no_match" })
        );
        return;
      }
      message.success(formatMessage({ id: "app.message.operate.success" }));
    } else {
      console.log("onUnknownProcessEnroll error:", res);
      return;
    }
    setState((st) => {
      return {
        ...st,
        unknownAssociateVisible: false,
      };
    });
  };

  const onRevoke = async (info) => {
    setBtnLoading(true);
    const res = await request(`/instance/${agentID}/node/_revoke`, {
      method: "POST",
      body: info,
    });
    setBtnLoading(false);
    if (res && !res.error) {
      message.success(formatMessage({ id: "app.message.operate.success" }));
    } else {
      console.log("onRevoke error:", res);
      return;
    }
    setQueryParams((st) => {
      return {
        ...st,
        t: new Date().valueOf(),
      };
    });
  };

  return (
    <div className={styles.detail}>
      <Tabs
        className={styles.detailTabs}
        activeKey={state.processesTab}
        onChange={(tabKey) => {
          setState({ ...state, processesTab: tabKey });
        }}
        tabBarExtraContent={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {hasAuthority("agent.instance:all") && state.processesTab === "unknown" ? (
              <Button
                icon="link"
                type="primary"
                onClick={() => {
                  setState((st) => {
                    return {
                      ...st,
                      unknownAssociateVisible: true,
                    };
                  });
                }}
              >
                {formatMessage({
                  id: "agent.instance.table.operation.associate",
                })}
              </Button>
            ) : null}

            <Button icon="redo" onClick={onRefreshClick}>
              {formatMessage({ id: "form.button.refresh" })}
            </Button>
          </div>
        }
      >
        <TabPane
          tab={formatMessage(
            {
              id: "agent.instance.row_detail.tab.detected_processes",
            },
            { count: nodes.length }
          )}
          key={"elasticsearch"}
        >
          <div className={styles.tableWrap}>
            <Table
              size={"small"}
              bordered
              loading={loading}
              dataSource={nodes}
              rowKey={"id"}
              tableLayout="fixed"
              pagination={{
                size: "small",
                showSizeChanger: true,
                showTotal: (total, range) =>
                  formatMessage(
                    { id: "system.security.pagination.total" },
                    { start: range[0], end: range[1], total }
                  ),
              }}
              columns={columns.filter((item) => item.key !== "collection_interval")}
            />
          </div>
        </TabPane>
        <TabPane
          tab={formatMessage(
            {
              id: "agent.instance.row_detail.tab.unknown_processes",
            },
            { count: unknownProcess.length }
          )}
          key={"unknown"}
        >
          <UnknownProcess data={unknownProcess} loading={loading} />
        </TabPane>
      </Tabs>
      {/* <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <div>Detected Processes</div>
        <div style={{ marginLeft: "auto" }}>
          <Button icon="redo" onClick={onRefreshClick}>
            {formatMessage({ id: "form.button.refresh" })}
          </Button>
        </div>
      </div> */}

      <Drawer
        title={formatMessage({ id: "agent.instance.associate.drawer.title" })}
        visible={state.associateVisible}
        destroyOnClose
        onClose={() => {
          setState((st) => {
            return {
              ...st,
              associateVisible: false,
            };
          });
        }}
        width={700}
      >
        <Associate
          record={state.associateNode}
          agentID={agentID} //TODO
          onAssociateComplete={onEnroll}
          loading={btnLoading}
        />
      </Drawer>
      <Drawer
        // ref={drawRef}
        visible={state.nodeDetailVisible}
        destroyOnClose
        width={800}
        title={
          <Title
            labels={detailTitleConfig.getLabels(state.nodeMetadata)}
            status={
              detailTitleConfig.getStatus
                ? detailTitleConfig.getStatus(state.nodeMetadata)
                : ""
            }
          />
        }
        onClose={() =>
          setState((st) => {
            return {
              ...st,
              nodeMetadata: {},
              nodeDetailVisible: false,
            };
          })
        }
      >
        <Content data={state.nodeMetadata} details={details} />
      </Drawer>
      <Drawer
        title={formatMessage({ id: "agent.instance.associate.drawer.title" })}
        visible={state.unknownAssociateVisible}
        destroyOnClose
        onClose={() => {
          setState((st) => {
            return {
              ...st,
              unknownAssociateVisible: false,
            };
          });
        }}
        width={700}
      >
        <UnknownAssociate
          onBatchEnroll={onUnknownProcessEnroll}
          loading={btnLoading}
        />
      </Drawer>
    </div>
  );
};
