import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import {
  Card,
  Table,
  Popconfirm,
  Divider,
  Form,
  Row,
  Col,
  Button,
  Input,
  message,
  Drawer,
  Radio,
  Tag,
  Select,
  Checkbox,
  Modal,
} from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { useGlobal } from "@/layouts/GlobalContext";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import router from "umi/router";
import Link from "umi/link";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import request from "@/utils/request";
import "@/assets/headercontent.scss";
import moment from "moment";
import { formatter } from "@/lib/format";
import { hasAuthority } from "@/utils/authority";
import InstallAgent from "@/components/InstallAgent";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { AgentRowDetail } from "./components/RowDetail";
import AutoEnroll from "./components/AutoEnroll";
import { sorter } from "@/utils/utils";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { isNumber } from "lodash";

const { Search } = Input;

const AgentList = (props) => {
  const [queryParams, setQueryParams] = React.useState({
    size: 20,
  });
  const [searchValue, setSearchValue] = React.useState("");

  const { loading, error, value } = useFetch(
    `/instance/_search`,
    {
      queryParams: { ...queryParams, application: "agent" },
    },
    [queryParams]
  );
  const [isLoading, setIsLoading] = React.useState(loading);
  const [btnLoading, setBtnLoading] = React.useState(false);
  const [delInstId, setDelInstId] = React.useState("");
  const onDeleteClick = useCallback(
    async (instanceID) => {
      const deleteRes = await request(`/instance/${instanceID}`, {
        method: "DELETE",
      });
      if (deleteRes && deleteRes.result == "deleted") {
        message.success("delete succeed");
        setIsLoading(true);
        setTimeout(() => {
          setDelInstId(instanceID);
          onRefreshClick();
        }, 1000);
      }
    },
    [setDelInstId]
  );
  const [editState, setEditState] = React.useState({
    drawerVisible: false,
    editItem: null,
    autoEnrollVisible: false,
  });
  const onTaskSettingsClick = (record) => {
    setEditState({
      drawerVisible: true,
      editItem: record,
    });
  };
  const [instanceStatus, setInstanceStatus] = React.useState({});

  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        sorter: (a, b) => sorter.string(a, b, "name"),
      },
      {
        title: "Endpoint",
        dataIndex: "endpoint",
        sorter: (a, b) => sorter.string(a, b, "endpoint"),
      },
      {
        title: "Status",
        width: 120,
        dataIndex: "status",
        render: (text, record) => {
          const status = instanceStatus[record.id]?.system ? "online" : "N/A";
          return <HealthStatusView status={status} label={text} />;
        },
        sorter: (a, b) => {
          const status1 = instanceStatus[a.id]?.system ? 1 : 0;
          const status2 = instanceStatus[b.id]?.system ? 1 : 0;
          return status1 - status2;
        },
      },
      {
        title: "CPU",
        width: 100,
        render: (text, record) => {
          return instanceStatus[record.id]?.system?.cpu ||
            isNumber(instanceStatus[record.id]?.system?.cpu)
            ? `${instanceStatus[record.id]?.system?.cpu}%`
            : null;
        },
        defaultSortOrder: "descend",
        sorter: (a, b) => {
          let cpu1 = 0;
          if (instanceStatus[a.id]?.system?.cpu) {
            cpu1 = instanceStatus[a.id]?.system?.cpu;
          }
          let cpu2 = 0;
          if (instanceStatus[b.id]?.system?.cpu) {
            cpu2 = instanceStatus[b.id]?.system?.cpu;
          }
          return cpu1 - cpu2;
        },
      },
      {
        title: "Memory",
        width: 130,
        render: (text, record) => {
          if (!instanceStatus[record.id]?.system) {
            return null;
          }
          const byteFormatted = formatter.bytes(
            instanceStatus[record.id]?.system?.mem
          );
          return byteFormatted.size + byteFormatted.unit;
        },
        sorter: (a, b) => {
          let mem1 = instanceStatus[a.id]?.system?.mem
            ? instanceStatus[a.id]?.system?.mem
            : 0;
          let mem2 = instanceStatus[b.id]?.system?.mem
            ? instanceStatus[b.id]?.system?.mem
            : 0;
          return mem1 - mem2;
        },
      },
      {
        title: "Uptime",
        width: 130,
        render: (text, record) => {
          if (!instanceStatus[record.id]?.system) {
            return null;
          }
          return moment
            .duration(instanceStatus[record.id]?.system?.uptime_in_ms, "ms")
            .humanize();
        },
        sorter: (a, b) => {
          let uptime1 = instanceStatus[a.id]?.system?.mem
            ? instanceStatus[a.id]?.system?.uptime_in_ms
            : 0;
          let uptime2 = instanceStatus[b.id]?.system?.mem
            ? instanceStatus[b.id]?.system?.uptime_in_ms
            : 0;
          return uptime1 - uptime2;
        },
      },
      // {
      //   title: "Clusters",
      //   dataIndex: "clusters",
      //   render: (val) => {
      //     return (val || []).map((cluster) => (
      //       <Tag color={cluster.task?.cluster_metric.owner ? "#108ee9" : ""}>
      //         <Link to={`/cluster/monitor/elasticsearch/${cluster.cluster_id}`}>
      //           {cluster.cluster_name}
      //         </Link>
      //       </Tag>
      //     ));
      //   },
      // },
      // {
      //   title: "Timestamp",
      //   render: (text, record) => {
      //     const timestamp = instanceStatus[record.id]?.timestamp;
      //     return timestamp ? formatUtcTimeToLocal(timestamp) : "N/A";
      //   },
      // },
      // {
      //   title: "Tags",
      //   dataIndex: "tags",
      //   render: (text) => {
      //     return text;
      //   },
      // },
      // {
      //   title: "Version",
      //   dataIndex: "version.number",
      // },
      // {
      //   title: "Last Updated",
      //   dataIndex: "updated",
      //   render: (text) => {
      //     return moment(text).format("YYYY-MM-DD HH:mm:ss");
      //   },
      // },
      {
        title: formatMessage({ id: "table.field.actions" }),
        width: 120,
        render: (text, record) => (
          <div>
            {hasAuthority("agent.instance:all") ? (
              <>
                {/* <Divider key="d2" type="vertical" /> Task Assignment*/}
                {/* <a onClick={() => onTaskSettingsClick(record)}>Task Settings</a>
                <Divider key="d3" type="vertical" /> */}
                <Link
                  key="edit"
                  to={`/resource/agent/instance/edit/${record.id}`}
                >
                  {formatMessage({ id: "form.button.edit" })}
                </Link>
                <Divider key="d3" type="vertical" />
                <Popconfirm
                  title="Sure to delete?"
                  onConfirm={() => onDeleteClick(record.id)}
                >
                  <a>{formatMessage({ id: "form.button.delete" })}</a>
                </Popconfirm>
              </>
            ) : null}
          </div>
        ),
      },
    ],

    [value, instanceStatus]
  );
  const { data: instances, total } = React.useMemo(() => {
    setIsLoading(loading);
    if (!value) {
      return {
        data: [],
        total: 0,
      };
    }
    const result = formatESSearchResult(value);
    return result;
  }, [value, loading]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!instances || instances.length == 0) {
        return;
      }
      const instanceIDs = instances.map((inst) => inst.id);
      const statusRes = await request(`/instance/stats`, {
        method: "POST",
        body: instanceIDs,
      });

      if (statusRes && !statusRes.error) {
        setInstanceStatus(statusRes);
      }
    };
    fetchStatus();
  }, [value]);

  const handleTableChange = (pagination, filters, sorter, extra) => {
    const { pageSize, current } = pagination;
    setQueryParams({
      from: (current - 1) * pageSize,
      size: pageSize,
      keyword: searchValue,
      current,
    });
  };

  React.useMemo(() => {
    setQueryParams({
      ...queryParams,
      keyword: searchValue,
    });
  }, [searchValue]);

  const onSearchClick = (val) => {
    setSearchValue(val);
  };

  const onRefreshClick = () => {
    setQueryParams({
      ...queryParams,
      t: new Date().valueOf(),
    });
  };
  const onSaveTaskSetClick = useCallback(async () => {
    if (!editState.taskState) {
      console.log("no changes");
      return;
    }
    const body = [];
    for (let k in editState.taskState) {
      body.push({
        cluster_id: k,
        node_uuid: editState.taskState[k],
      });
    }
    const setRes = await request(
      `/instance/${editState.editItem.id}/_set_task`,
      {
        method: "POST",
        body: body,
      }
    );
    if (setRes && setRes.result == "success") {
      message.success("Set successfully");
      setTimeout(onRefreshClick, 1000);
    }
  }, [editState]);
  const addSuccessCb = useCallback(() => {
    setEditState({
      installVisible: false,
    });
    setTimeout(onRefreshClick, 1000);
  }, [onRefreshClick]);

  const expandedRowRender = useCallback(
    (record) => {
      if (delInstId == record.id) {
        return null;
      }
      return <AgentRowDetail agentID={record.id} t={queryParams.t} />;
    },
    [queryParams.t, delInstId]
  );

  const onAutoEnroll = async (clusterIDs) => {
    if (!Array.isArray(clusterIDs) || clusterIDs.length === 0) {
      message.warn(
        formatMessage({ id: "agent.instance.associate.tips.associate" })
      );
      return;
    }
    setBtnLoading(true);
    const res = await request(`/instance/node/_auto_enroll`, {
      method: "POST",
      body: {
        cluster_id: clusterIDs,
      },
    });
    setBtnLoading(false);
    if (res?.acknowledged === true) {
      message.success(formatMessage({ id: "app.message.operate.success" }));
      setEditState((st) => {
        return {
          ...st,
          autoEnrollVisible: false,
        };
      });
      onRefreshClick();
    } else {
      console.log("onAutoEnroll error:", res);
    }
  };

  return (
    <PageHeaderWrapper>
      <Card>
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
                onSearchClick(value);
              }}
              onChange={(e) => {
                onSearchClick(e.currentTarget.value);
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
            {
              hasAuthority("agent.instance:all") && (
                <>
                  <Button
                    type="primary"
                    onClick={() => {
                      setEditState((st) => {
                        return {
                          ...st,
                          autoEnrollVisible: true,
                        };
                      });
                    }}
                  >
                    {formatMessage({ id: "agent.instance.auto_associate.title" })}
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      setEditState((st) => {
                        return {
                          ...st,
                          installVisible: true,
                        };
                      });
                    }}
                  >
                    {formatMessage({ id: "agent.instance.install.title" })}
                  </Button>
                </>
              )
            }
            <Button icon="redo" onClick={onRefreshClick}>
              {formatMessage({ id: "form.button.refresh" })}
            </Button>
            {hasAuthority("agent.instance:all") ? (
              <Button
                type="primary"
                icon="plus"
                onClick={() => router.push(`/resource/agent/new`)}
              >
                {formatMessage({ id: "gateway.instance.btn.new" })}
              </Button>
            ) : null}
          </div>
        </div>

        <Table
          size={"small"}
          loading={isLoading}
          bordered
          dataSource={instances}
          rowKey={"id"}
          pagination={{
            size: "small",
            pageSize: queryParams.size,
            total: total?.value || total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          columns={columns}
          onChange={handleTableChange}
          expandedRowRender={expandedRowRender}
          scroll={{x: 1100 }}
        />
        <Drawer
          title={`Task Settings(${editState.editItem?.remote_ip})`}
          visible={editState.drawerVisible}
          onClose={() => {
            setEditState({
              drawerVisible: false,
            });
          }}
          width={720}
        >
          <Card bordered={false}>
            <div style={{ fontWeight: 600 }}>
              Metadata、Cluster Level Metrics
            </div>
            {(editState.editItem?.clusters || []).map((cluster) => {
              return (
                <div
                  style={{
                    borderBottom: "1px solid #d9d9d9",
                    lineHeight: "1.6em",
                  }}
                >
                  <div
                    style={{
                      margin: "1em 0",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: "0 0 30%" }}>
                      Cluster：{cluster.cluster_name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ flex: "0 0 auto" }}></div>
                      <div style={{ flex: "1 1 auto" }}>
                        <Select
                          style={{ width: "300px" }}
                          defaultValue={
                            cluster.task?.cluster_metric.task_node_id
                          }
                          onChange={(val) => {
                            setEditState((estate) => {
                              const taskState = estate.taskState || {};
                              taskState[cluster.cluster_id] = val;
                              return {
                                ...estate,
                                taskState,
                              };
                            });
                          }}
                        >
                          {(cluster.nodes || []).map((node) => {
                            if (!node.uuid) {
                              return null;
                            }
                            return (
                              <Select.Option value={node.uuid}>
                                {node.name}
                              </Select.Option>
                            );
                          })}
                        </Select>
                        {/* <Radio.Group
                          onChange={(e) => {
                            setEditState((estate) => {
                              const taskState = estate.taskState || {};
                              taskState[cluster.cluster_id] = e.target.value;
                              return {
                                ...estate,
                                taskState,
                              };
                            });
                          }}
                          // value={this.state.value
                          defaultValue={
                            cluster.task?.cluster_metric.task_node_id
                          }
                        >
                          {(cluster.nodes || []).map((node) => {
                            if (!node.uuid) {
                              return null;
                            }
                            return <Radio value={node.uuid}>{node.name}</Radio>;
                          })}
                        </Radio.Group> */}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ fontWeight: 600, marginTop: 30 }}>
              Node Level Metrics
            </div>
            {(editState.editItem?.clusters || []).map((cluster) => {
              return (
                <div
                  style={{
                    borderBottom: "1px solid #d9d9d9",
                    lineHeight: "1.6em",
                  }}
                >
                  <div
                    style={{
                      margin: "1em 0",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: "0 0 30%" }}>
                      Cluster：{cluster.cluster_name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ flex: "0 0 auto" }}></div>
                      <div style={{ flex: "1 1 auto" }}>
                        {(cluster.nodes || []).map((node) => {
                          if (!node.uuid) {
                            return null;
                          }
                          return <Checkbox checked>{node.name}</Checkbox>;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: "1em", textAlign: "right" }}>
              <Button
                disabled={editState.editItem?.status == "offline"}
                type="primary"
                onClick={onSaveTaskSetClick}
              >
                {formatMessage({ id: "form.button.save" })}
              </Button>
            </div>
          </Card>
        </Drawer>

        <Drawer
          title={formatMessage({ id: "agent.instance.install.title" })}
          visible={editState.installVisible}
          destroyOnClose
          onClose={() => {
            setEditState((st) => {
              return {
                ...st,
                installVisible: false,
              };
            });
          }}
          width={700}
        >
          <InstallAgent autoInit={true} />
        </Drawer>

        <Drawer
          title={formatMessage({ id: "agent.instance.auto_associate.title" })}
          visible={editState.autoEnrollVisible}
          destroyOnClose
          onClose={() => {
            setEditState((st) => {
              return {
                ...st,
                autoEnrollVisible: false,
              };
            });
          }}
          width={700}
        >
          <AutoEnroll onEnroll={onAutoEnroll} loading={btnLoading} />
        </Drawer>
      </Card>
    </PageHeaderWrapper>
  );
};

export default AgentList;

const DiscoverAgent = ({ addSuccessCb }) => {
  const [state, setState] = useState({
    queryParams: {
      unregistered: "1",
    },
  });
  const onSelectChange = (selectedRowKeys) => {
    setState((st) => {
      return {
        ...st,
        selectedRowKeys,
      };
    });
  };
  const rowSelection = {
    selectedRowKeys: state.selectedRowKeys,
    onChange: onSelectChange,
  };
  const onDeleteClick = useCallback(async (instanceID) => {
    const deleteRes = await request(`/instance/${instanceID}`, {
      method: "DELETE",
    });
    if (deleteRes && deleteRes.result == "deleted") {
      message.success("delete succeed");
      setTimeout(() => {
        setState((st) => {
          return {
            ...st,
            queryParams: {
              ...st.queryParams,
              t: new Date().valueOf(),
            },
          };
        });
      }, 1000);
    }
  }, []);
  const columns = [
    {
      title: "Agent IP",
      dataIndex: "remote_ip",
    },
    {
      title: "Version",
      dataIndex: "version",
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => (
        <div>
          {hasAuthority("agent.instance:all") ? (
            <>
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => onDeleteClick(record.id)}
              >
                <a>{formatMessage({ id: "form.button.delete" })}</a>
              </Popconfirm>
            </>
          ) : null}
        </div>
      ),
    },
  ];
  const { loading, error, value } = useFetch(
    `/instance/_search`,
    {
      queryParams: { ...state.queryParams, application: "agent" },
    },
    [state.queryParams]
  );

  const { data: instances, total } = React.useMemo(() => {
    if (!value) {
      return {
        data: [],
        total: 0,
      };
    }
    return formatESSearchResult(value);
  }, [value, loading]);

  const onAddAgentsClick = async () => {
    if ((state.selectedRowKeys || []).length > 0) {
      const confirmRes = await request(`/instance/_enroll`, {
        method: "POST",
        body: state.selectedRowKeys,
      });
      if (confirmRes && confirmRes.success === true) {
        message.success("add successfully");
        addSuccessCb();
      } else {
        message.error(JSON.stringify(confirmRes.errors));
      }
    }
  };
  return (
    <div>
      <Table
        bordered
        size={"small"}
        loading={loading}
        rowSelection={rowSelection}
        columns={columns}
        rowKey="id"
        dataSource={instances}
      />
      <div style={{ textAlign: "right", marginTop: "1em" }}>
        <Button type="primary" onClick={onAddAgentsClick}>
          Add Agents
        </Button>
      </div>
    </div>
  );
};
