import { Fragment, useEffect, useMemo, useReducer, useState } from "react";
import {
  Button,
  Card,
  Divider,
  Empty,
  Icon,
  Input,
  message,
  Popconfirm,
  Progress,
  Table,
  Tag,
  Tooltip,
} from "antd";
import Link from "umi/link";
import router from "umi/router";
import { formatMessage } from "umi/locale";

import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import RefreshGroup from "@/components/infini/RefreshGroup";
import useFetch from "@/lib/hooks/use_fetch";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import ClusterName from "@/pages/System/Cluster/components/ClusterName";
import request from "@/utils/request";
import { hasAuthority } from "@/utils/authority";

import {
  formatTaskLastRunTime,
  getTaskRunningState,
  getTaskTotal,
  parseTaskConfig,
} from "./utils";

import SearchInput from "@/components/infini/SearchInput";

const TaskStatus = ({ record }) => {
  const runningState = getTaskRunningState(record);
  const pending = record.repeat?.is_repeat || ["init", "ready", "pending_stop"].includes(record.status);
  const tagStyle =
    runningState === 1
      ? { color: "#448EF7", backgroundColor: "rgba(68, 142, 247, 0.2)" }
      : { backgroundColor: "#E8E8E8" };

  let label = formatMessage({
    id: "data_tools.task.stopped",
    defaultMessage: "Stopped",
  });

  if (runningState === 1) {
    label = formatMessage({
      id: "data_tools.task.running",
      defaultMessage: "Running",
    });
  } else if (pending) {
    label = formatMessage({
      id: "data_tools.task.pending",
      defaultMessage: "Pending",
    });
  }

  return (
    <div>
      <Tag style={{ border: "none", ...tagStyle }}>{label}</Tag>
      {!record.repeat?.is_repeat && record.status === "complete" ? (
        <span
          style={{
            background: "rgba(108, 206, 121, 0.2)",
            padding: "1px 3px",
            borderRadius: 4,
          }}
        >
          <Icon style={{ color: "#6CCE79" }} type="check-circle" />
        </span>
      ) : null}
      {record.error_partitions > 0 ? (
        <Tooltip
          title={`${formatMessage({
            id: "data_tools.task.error_partitions",
            defaultMessage: "Error partitions",
          })}: ${record.error_partitions}`}
        >
          <span
            style={{
              background: "rgba(243, 95, 90, 0.2)",
              padding: "1px 3px",
              marginLeft: 4,
              borderRadius: 4,
            }}
          >
            <Icon style={{ color: "#F35F5A" }} type="exclamation-circle" />
          </span>
        </Tooltip>
      ) : null}
      {record.repeat?.is_repeat && record.repeat?.next_run_time ? (
        <Tooltip
          title={
            <div>
              {formatMessage({
                id: "data_tools.task.next_run_time",
                defaultMessage: "Next run time",
              })}
              :<br />
              {record.repeat.next_run_time}
            </div>
          }
        >
          <span
            style={{
              background: "rgba(68, 142, 247, 0.2)",
              padding: "1px 3px",
              marginLeft: 4,
              borderRadius: 4,
            }}
          >
            <Icon style={{ color: "#448EF7" }} type="clock-circle" />
          </span>
        </Tooltip>
      ) : null}
    </div>
  );
};

const callTaskAPI = async (kind, id, action) => {
  if (action === "delete") {
    return request(`/${kind}/data/${id}`, {
      method: "DELETE",
    });
  }

  return request(`/${kind}/data/${id}/_${action}`, {
    method: "POST",
  });
};

const TaskPage = ({
  kind,
  authority,
  title,
  detailBasePath,
  newPath,
  generateName,
  restartStatuses,
  formatTask,
  renderProgressContent,
}) => {
  const initialQueryParams = {
    from: 0,
    size: 10,
  };

  const [searchValue, setSearchValue] = useState("");

  function reducer(queryParams, action) {
    switch (action.type) {
      case "search":
        return {
          ...queryParams,
          from: 0,
          keyword: action.value,
        };
      case "pagination":
        return {
          ...queryParams,
          from: (action.value - 1) * queryParams.size,
        };
      case "pageSizeChange":
        return {
          ...queryParams,
          from: 0,
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

  const [queryParams, dispatch] = useReducer(reducer, initialQueryParams);
  const [dataSource, setDataSource] = useState({ data: [], total: 0 });
  const canManage = hasAuthority(`${authority}:all`);

  const { loading, value } = useFetch(
    `/${kind}/data/_search`,
    {
      queryParams,
    },
    [queryParams]
  );

  useEffect(() => {
    const { data, total } = formatESSearchResult(value);
    const rows = (data || []).map((item) => {
      const config = parseTaskConfig(item);

      return {
        ...item,
        name: config.name || "",
        cluster: config.cluster || {},
        creator: config.creator?.name || "-",
        indicesCount: (config.indices || []).length,
        repeat: item.repeat || item.metadata?.labels?.repeat || {},
        ...formatTask(item, config),
      };
    });

    setDataSource({
      data: rows,
      total: getTaskTotal(total),
    });
  }, [formatTask, value]);

  const onRefreshClick = () => {
    dispatch({ type: "refresh" });
  };

  const onAction = async (record, action) => {
    const res = await callTaskAPI(kind, record.id, action);
    const actionLabelId = action === "delete" ? "delete" : action;

    if ((action === "delete" && res?.result === "deleted") || (action !== "delete" && res?.success)) {
      message.success(
        formatMessage({
          id: `app.message.${actionLabelId}.success`,
        })
      );
      onRefreshClick();
      return;
    }

    message.error(
      formatMessage({
        id: `app.message.${actionLabelId}.failed`,
      })
    );
  };

  const columns = useMemo(() => {
    return [
      {
        title: formatMessage({
          id: "data_tools.task.name",
          defaultMessage: "Task Name",
        }),
        dataIndex: "name",
        render: (text, record) => {
          const finalName = text || generateName(record);

          return (
            <Tooltip title={finalName}>
              <Link
                to={`${detailBasePath}/${record.id}/detail`}
                style={{
                  display: "inline-block",
                  maxWidth: 360,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {finalName}
              </Link>
            </Tooltip>
          );
        },
      },
      {
        title: formatMessage({
          id: "data_tools.task.cluster",
          defaultMessage: "Cluster",
        }),
        dataIndex: "cluster",
        width: 320,
        render: (cluster = {}) => {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ClusterName
                name={cluster.source?.name || "-"}
                distribution={cluster.source?.distribution}
                id={cluster.source?.id}
              />
              <Icon type="swap" style={{ color: "#999" }} />
              <ClusterName
                name={cluster.target?.name || "-"}
                distribution={cluster.target?.distribution}
                id={cluster.target?.id}
              />
            </div>
          );
        },
      },
      {
        title: formatMessage({
          id: "data_tools.task.progress",
          defaultMessage: "Progress",
        }),
        dataIndex: "percent",
        width: 140,
        render: (percent, record) => {
          const runningState = getTaskRunningState(record);
          const progressStatus = runningState === 1 ? "active" : "normal";
          let strokeColor;

          if (record.status === "error" || record.error_partitions > 0) {
            strokeColor = "#E8E8E8";
          } else if (record.status === "complete") {
            strokeColor = "#6CCE79";
          }

          return (
            <div style={{ width: 80 }}>
              <Tooltip title={renderProgressContent(record)}>
                <Progress
                  showInfo={false}
                  strokeWidth={16}
                  strokeColor={strokeColor}
                  percent={percent}
                  status={progressStatus}
                />
              </Tooltip>
            </div>
          );
        },
      },
      {
        title: formatMessage({
          id: "data_tools.task.status",
          defaultMessage: "Status",
        }),
        dataIndex: "status",
        width: 150,
        render: (_, record) => <TaskStatus record={record} />,
      },
      {
        title: formatMessage({
          id: "data_tools.task.last_run_time",
          defaultMessage: "Last Run Time",
        }),
        dataIndex: "start_time_in_millis",
        width: 180,
        render: (_, record) => formatTaskLastRunTime(record),
      },
      {
        title: formatMessage({ id: "table.field.actions" }),
        width: 240,
        render: (_, record) => {
          const actions = [];
          const isRepeat = record.repeat?.is_repeat;
          const repeating = record.repeat?.repeating;

          if (canManage && record.status === "init") {
            actions.push(
              <Popconfirm
                key="start"
                title="Sure to start?"
                onConfirm={() => onAction(record, "start")}
              >
                <a>{formatMessage({ id: "form.button.start" })}</a>
              </Popconfirm>
            );
          }

          if (!isRepeat) {
            if (canManage && restartStatuses.includes(record.status)) {
              actions.push(
                <Popconfirm
                  key="restart"
                  title="Sure to restart?"
                  onConfirm={() => onAction(record, "start")}
                >
                  <a>{formatMessage({ id: "form.button.restart" })}</a>
                </Popconfirm>
              );
            }

            if (canManage && record.status === "running") {
              actions.push(
                <Popconfirm
                  key="stop"
                  title="Sure to stop?"
                  onConfirm={() => onAction(record, "stop")}
                >
                  <a>{formatMessage({ id: "form.button.stop" })}</a>
                </Popconfirm>
              );
            }
          } else {
            if (canManage && !repeating) {
              actions.push(
                <Popconfirm
                  key="resume"
                  title="Sure to resume?"
                  onConfirm={() => onAction(record, "resume")}
                >
                  <a>{formatMessage({ id: "form.button.resume" })}</a>
                </Popconfirm>
              );
            }

            if (canManage && repeating) {
              actions.push(
                <Popconfirm
                  key="pause"
                  title="Sure to pause?"
                  onConfirm={() => onAction(record, "pause")}
                >
                  <a>{formatMessage({ id: "form.button.pause" })}</a>
                </Popconfirm>
              );
            }
          }

          actions.push(
            <Link key="detail" to={`${detailBasePath}/${record.id}/detail`}>
              {formatMessage({ id: "form.button.detail" })}
            </Link>
          );

          if (
            canManage &&
            ["init", "stopped", "error", "complete"].includes(record.status) &&
            record.running_children === 0
          ) {
            actions.push(
              <Popconfirm
                key="delete"
                title={formatMessage({ id: "app.message.confirm.delete" })}
                onConfirm={() => onAction(record, "delete")}
              >
                <a>{formatMessage({ id: "form.button.delete" })}</a>
              </Popconfirm>
            );
          }

          return (
            <>
              {actions.map((item, index) => (
                <Fragment key={index}>
                  {index !== 0 ? <Divider type="vertical" /> : null}
                  {item}
                </Fragment>
              ))}
            </>
          );
        },
      },
    ];
  }, [
    canManage,
    detailBasePath,
    generateName,
    renderProgressContent,
    restartStatuses,
  ]);

  return (
    <PageHeaderWrapper title={title}>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ maxWidth: 420, flex: "1 1 auto" }}>
            <SearchInput
              allowClear
              value={searchValue}
              placeholder={formatMessage({
                id: "data_tools.task.keyword",
                defaultMessage: "Search by keyword",
              })}
              enterButton={formatMessage({ id: "form.button.search" })}
              onSearch={(search) => dispatch({ type: "search", value: search })}
              onChange={(e) => setSearchValue(e.currentTarget.value)}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RefreshGroup onRefresh={onRefreshClick} setRefreshIntervalFlag={() => {}} />
            {newPath && canManage ? (
              <Button type="primary" icon="plus" onClick={() => router.push(newPath)}>
                {formatMessage({ id: "form.button.new" })}
              </Button>
            ) : null}
          </div>
        </div>
        <Table
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={dataSource.data}
          columns={columns}
          locale={{
            emptyText: (
              <Empty
                description={formatMessage({
                  id: "data_tools.task.empty",
                  defaultMessage: "No tasks found",
                })}
              />
            ),
          }}
          pagination={{
            size: "small",
            pageSize: queryParams.size,
            total: dataSource.total,
            onChange: (page) => dispatch({ type: "pagination", value: page }),
            showSizeChanger: true,
            onShowSizeChange: (_, size) =>
              dispatch({ type: "pageSizeChange", value: size }),
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
          }}
        />
      </Card>
    </PageHeaderWrapper>
  );
};

export default TaskPage;
