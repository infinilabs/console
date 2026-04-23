import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Table,
  Tag,
  Tooltip,
} from "antd";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import ClusterName from "@/pages/System/Cluster/components/ClusterName";
import useFetch from "@/lib/hooks/use_fetch";
import { formatMessage } from "umi/locale";

import {
  formatCount,
  formatTaskLastRunTime,
  formatTime,
  parseTaskConfig,
} from "./utils";

const TaskDetail = ({
  match,
  history,
  kind,
  title,
  generateName,
  progressField,
}) => {
  const id = match?.params?.id || "";
  const [refreshFlag, setRefreshFlag] = useState(0);

  const { loading, value } = useFetch(`/${kind}/data/${id}/info`, {}, [id, refreshFlag]);

  const config = useMemo(() => parseTaskConfig(value), [value]);
  const labels = value?.metadata?.labels || {};
  const repeat = labels.repeat || {};
  const indices = config.indices || [];
  const taskName =
    config.name ||
    generateName({
      cluster: config.cluster || {},
      indicesCount: indices.length,
    });

  const columns = useMemo(() => {
    return [
      {
        title: formatMessage({
          id: "data_tools.task.indices.source_index",
          defaultMessage: "Source Index",
        }),
        render: (_, record) => record.source?.name || "-",
      },
      {
        title: formatMessage({
          id: "data_tools.task.indices.target_index",
          defaultMessage: "Target Index",
        }),
        render: (_, record) => record.target?.name || "-",
      },
      {
        title: formatMessage({
          id: "data_tools.task.indices.source_docs",
          defaultMessage: "Source Docs",
        }),
        width: 130,
        render: (_, record) => formatCount(record.source?.docs),
      },
      {
        title: formatMessage({
          id: "data_tools.task.indices.target_docs",
          defaultMessage: "Target Docs",
        }),
        width: 130,
        render: (_, record) => formatCount(record.target?.docs),
      },
      {
        title: formatMessage({
          id: "data_tools.task.progress",
          defaultMessage: "Progress",
        }),
        dataIndex: progressField,
        width: 120,
        render: (text) => {
          const percent = typeof text === "number" ? text : 0;
          return `${percent}%`;
        },
      },
      {
        title: formatMessage({
          id: "data_tools.task.status",
          defaultMessage: "Status",
        }),
        width: 120,
        render: (_, record) => {
          if (record.running_children > 0) {
            return (
              <Tag color="processing">
                {formatMessage({
                  id: "data_tools.task.running",
                  defaultMessage: "Running",
                })}
              </Tag>
            );
          }

          if (record.error_partitions > 0) {
            return (
              <Tooltip
                title={`${formatMessage({
                  id: "data_tools.task.error_partitions",
                  defaultMessage: "Error partitions",
                })}: ${record.error_partitions}`}
              >
                <Tag color="error">
                  {formatMessage({
                    id: "data_tools.task.error",
                    defaultMessage: "Error",
                  })}
                </Tag>
              </Tooltip>
            );
          }

          return (
            <Tag color="success">
              {formatMessage({
                id: "data_tools.task.idle",
                defaultMessage: "Idle",
              })}
            </Tag>
          );
        },
      },
    ];
  }, [progressField]);

  return (
    <PageHeaderWrapper title={title}>
      <Card
        loading={loading}
        title={taskName}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => setRefreshFlag(new Date().getTime())} icon="redo">
              {formatMessage({ id: "form.button.refresh" })}
            </Button>
            <Button
              onClick={() =>
                history.push(`/data_tools/${kind === "comparison" ? "comparison" : "migration"}`)
              }
            >
              {formatMessage({ id: "form.button.goback" })}
            </Button>
          </div>
        }
      >
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item
            label={formatMessage({
              id: "data_tools.task.source_cluster",
              defaultMessage: "Source Cluster",
            })}
          >
            <ClusterName
              name={config.cluster?.source?.name || "-"}
              distribution={config.cluster?.source?.distribution}
              id={config.cluster?.source?.id}
            />
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "data_tools.task.target_cluster",
              defaultMessage: "Target Cluster",
            })}
          >
            <ClusterName
              name={config.cluster?.target?.name || "-"}
              distribution={config.cluster?.target?.distribution}
              id={config.cluster?.target?.id}
            />
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "data_tools.task.creator",
              defaultMessage: "Creator",
            })}
          >
            {config.creator?.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "data_tools.task.start_time",
              defaultMessage: "Start Time",
            })}
          >
            {formatTime(value?.start_time_in_millis)}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "data_tools.task.last_run_time",
              defaultMessage: "Last Run Time",
            })}
          >
            {formatTaskLastRunTime({
              start_time_in_millis: value?.start_time_in_millis,
              repeat,
            })}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "data_tools.task.indices_count",
              defaultMessage: "Total Indices",
            })}
          >
            {indices.length}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "data_tools.task.completed_indices",
              defaultMessage: "Completed Indices",
            })}
          >
            {labels.completed_indices || 0}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "data_tools.task.status",
              defaultMessage: "Status",
            })}
          >
            {value?.status || "-"}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "data_tools.task.repeat",
              defaultMessage: "Repeat",
            })}
          >
            {repeat?.is_repeat ? "Yes" : "No"}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "data_tools.task.tags",
              defaultMessage: "Tags",
            })}
            span={2}
          >
            {(config.tags || labels.tags || []).length > 0
              ? (config.tags || labels.tags || []).map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))
              : "-"}
          </Descriptions.Item>
        </Descriptions>
        <div style={{ marginTop: 24 }}>
          <Table
            rowKey={(record) =>
              `${record.source?.name || ""}:${record.source?.doc_type || ""}`
            }
            size="small"
            columns={columns}
            dataSource={indices}
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
            pagination={false}
          />
        </div>
      </Card>
    </PageHeaderWrapper>
  );
};

export default TaskDetail;
