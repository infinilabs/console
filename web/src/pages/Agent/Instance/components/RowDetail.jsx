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
} from "antd";
import { useMemo, useState } from "react";
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

const { TabPane } = Tabs;

const details = [
  { title: "Metrics", component: Metrics, key: "metrics" },
  { title: "Infos", component: Infos, key: "infos" },
  { title: "Logs", component: Logs, key: "logs" },
];

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
        title: "PID",
        dataIndex: "node_info.process.id",
      },
      {
        title: "Port",
        dataIndex: "node_info.http.publish_address",
        render: (text, record) => {
          return text?.split(":")?.[1];
        },
      },
      {
        title: "Cluster",
        dataIndex: "cluster_info.cluster_name",
        render: (text, record) => {
          return <>
            <div style={{
              display: 'inline-block',
              marginRight: '3px',
              position: 'relative',
              top: -2
            }}>
              <SearchEngineIcon
                distribution={record.cluster_info.version.distribution}
                width="16px"
                height="16px"
              />
            </div> 
            {record.cluster_id ? (
              <Link to={`/cluster/monitor/elasticsearch/${record.cluster_id}`}>
                {text}
              </Link>
              ) : (
                text
              )}
          </>
        },
      },
      {
        title: "Node",
        dataIndex: "node_info.name",
        render: (text, record) => {
          return record.cluster_id ? (
            <IconText
              icon={<Icon type="database" />}
              text={
                <Link
                  to={`/cluster/monitor/${record.cluster_id}/nodes/${record.id}?_g={"cluster_name":"${record.cluster_info.cluster_name}","node_name":"${text}"}`}
                >
                  {text}
                </Link>
              }
            />
          ) : (
            text
          );
        },
      },
      {
        title: "Home",
        dataIndex: "node_info.settings.path.home",
        render: (text) => <AutoTextEllipsis >{text}</AutoTextEllipsis>,
        className: commonStyles.maxColumnWidth
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (text, record) => {
          const status = text == "online" ? "online" : "gray";
          return <HealthStatusView status={status} label={text} />;
        },
        width: 100,
      },
      {
        title: formatMessage({ id: "table.field.actions" }),
        width: 160,
        render: (text, record) => (
          <div>
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
                        title="Sure to revoke?"
                        onConfirm={() =>
                          onRevoke({
                            cluster_id: record.cluster_id,
                            cluster_uuid: record.cluster_info.cluster_uuid,
                            node_uuid: record.id,
                          })
                        }
                      >
                        <Button style={{padding: 0}} type="link" loading={btnLoading}>
                          Revoke
                        </Button>
                      </Popconfirm>
                      <Divider key="d3" type="vertical" />
                    </>
                  )
                }
                <a
                  onClick={() => {
                    onDetailClick(record.id, record.cluster_id);
                  }}
                >
                  {formatMessage({
                    id: "agent.instance.table.operation.detail",
                  })}
                </a>
              </>
            ) : (
              <a
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
              </a>
            )}
          </div>
        ),
      },
    ],
    [agentID]
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

  const onUnknownProcessEnroll = async (clusterIDs) => {
    if (!Array.isArray(clusterIDs) || clusterIDs.length === 0) {
      message.warn(
        formatMessage({ id: "agent.instance.associate.tips.associate" })
      );
      return;
    }
    setBtnLoading(true);
    const res = await request(`/instance/${agentID}/node/_discovery`, {
      method: "POST",
      body: {
        cluster_id: clusterIDs,
      },
    });
    setBtnLoading(false);
    if (res && !res.error) {
      message.success(formatMessage({ id: "app.message.operate.success" }));
      if (res.nodes) {
        setDataSource({ ...res, t: Date.now() });
      }
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
    <div>
      <Tabs
        activeKey={state.processesTab}
        onChange={(tabKey) => {
          setState({ ...state, processesTab: tabKey });
        }}
        tabBarExtraContent={
          <div style={{ display: "flex", gap: 10 }}>
            {hasAuthority("agent.instance:all") && state.processesTab === "unknown" ? (
              <Button
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
          tab={`Detected Processes (${nodes.length})`}
          key={"elasticsearch"}
        >
          <Table
            size={"small"}
            bordered
            loading={loading}
            dataSource={nodes}
            rowKey={"id"}
            pagination={{
              size: "small",
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            columns={columns}
          />
        </TabPane>
        <TabPane
          tab={`Unknown Processes (${unknownProcess.length})`}
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
