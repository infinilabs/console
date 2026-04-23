import { useEffect, useMemo, useState } from "react";
import { connect } from "dva";
import router from "umi/router";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Input,
  InputNumber,
  Row,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import request from "@/utils/request";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { formatMessage } from "umi/locale";
import { formatter } from "@/utils/format";

import SearchInput from "@/components/infini/SearchInput";

const defaultMigrationSettings = {
  scroll: {
    slice_size: 1,
    docs: 1000,
    timeout: 5,
  },
  bulk: {
    slice_size: 1,
    docs: 5000,
    store_size_in_mb: 10,
    max_worker_size: 10,
    idle_timeout_in_seconds: 5,
    compress: false,
  },
};

const defaultComparisonSettings = {
  dump: {
    slice_size: 1,
    docs: 1000,
    timeout: 5,
    partition_size: 1,
  },
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return formatter.number(value);
};

const normalizeRuntimeInstances = (data = []) => {
  return data
    .filter((item) => item.id && item.name && item.status === "online")
    .map((item) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      group_id: item.group_id || "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const CreateTaskPage = ({
  dispatch,
  clusterList = [],
  kind,
  title,
  listPath,
  generateName,
  buildPayload,
}) => {
  const [sourceClusterId, setSourceClusterId] = useState();
  const [targetClusterId, setTargetClusterId] = useState();
  const [sourceIndices, setSourceIndices] = useState([]);
  const [targetIndicesMap, setTargetIndicesMap] = useState({});
  const [selectedIndices, setSelectedIndices] = useState({});
  const [runtimeInstances, setRuntimeInstances] = useState([]);
  const [selectedRuntimeIds, setSelectedRuntimeIds] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [tags, setTags] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [indicesLoading, setIndicesLoading] = useState(false);
  const [runtimeInstancesLoading, setRuntimeInstancesLoading] = useState(false);
  const [migrationSettings, setMigrationSettings] = useState(defaultMigrationSettings);
  const [comparisonSettings, setComparisonSettings] = useState(defaultComparisonSettings);

  useEffect(() => {
    if (clusterList.length === 0) {
      dispatch({
        type: "global/fetchClusterList",
        payload: {
          size: 200,
          name: "",
        },
      });
      dispatch({
        type: "global/fetchClusterStatus",
      });
    }
  }, [clusterList.length, dispatch]);

  useEffect(() => {
    let cancelled = false;

    const loadRuntimeInstances = async () => {
      setRuntimeInstancesLoading(true);
      try {
        const response = await request("/instance/_search", {
          queryParams: {
            from: 0,
            size: 200,
          },
        });
        if (cancelled) {
          return;
        }
        const { data } = formatESSearchResult(response);
        setRuntimeInstances(normalizeRuntimeInstances(data));
      } catch (e) {
        if (!cancelled) {
          setRuntimeInstances([]);
        }
      } finally {
        if (!cancelled) {
          setRuntimeInstancesLoading(false);
        }
      }
    };

    loadRuntimeInstances();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadIndices = async (clusterId, setter) => {
    if (!clusterId) {
      setter(kind === "comparison" ? {} : []);
      return;
    }

    try {
      setIndicesLoading(true);
      const response = await request(`/elasticsearch/${clusterId}/indices/realtime`, {
        method: "GET",
      });
      if (setter === setTargetIndicesMap) {
        const nextMap = {};
        (response || []).forEach((item) => {
          nextMap[item.index] = item;
        });
        setter(nextMap);
      } else {
        setter(response || []);
      }
    } finally {
      setIndicesLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIndices({});
    loadIndices(sourceClusterId, setSourceIndices);
  }, [sourceClusterId]);

  useEffect(() => {
    loadIndices(targetClusterId, setTargetIndicesMap);
  }, [targetClusterId]);

  useEffect(() => {
    setSelectedIndices((previous) => {
      const next = {};
      Object.keys(previous).forEach((key) => {
        const item = previous[key];
        const targetName = item.target?.name || key;
        next[key] = {
          ...item,
          target: {
            ...item.target,
            docs: targetIndicesMap[targetName]?.docs_count || 0,
          },
        };
      });
      return next;
    });
  }, [targetIndicesMap]);

  const clusterMap = useMemo(() => {
    const map = {};
    clusterList.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [clusterList]);

  const sourceIndicesMap = useMemo(() => {
    const map = {};
    sourceIndices.forEach((item) => {
      map[item.index] = item;
    });
    return map;
  }, [sourceIndices]);

  const selectedRowKeys = useMemo(() => Object.keys(selectedIndices), [selectedIndices]);

  const filteredIndices = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return sourceIndices;
    }
    return sourceIndices.filter((item) =>
      item.index.toLowerCase().includes(normalizedKeyword)
    );
  }, [keyword, sourceIndices]);

  const selectedItems = useMemo(() => {
    return selectedRowKeys.map((key) => selectedIndices[key]).filter(Boolean);
  }, [selectedIndices, selectedRowKeys]);

  const updateSelectedKeys = (keys) => {
    setSelectedIndices((previous) => {
      const next = {};
      keys.forEach((key) => {
        const current = previous[key];
        const sourceIndex = sourceIndicesMap[key];
        if (!sourceIndex) {
          return;
        }
        next[key] = current || {
          source: {
            name: sourceIndex.index,
            doc_type: "",
            docs: sourceIndex.docs_count || 0,
          },
          target: {
            name: key,
            doc_type: "",
            docs: targetIndicesMap[key]?.docs_count || 0,
          },
        };
      });
      return next;
    });
  };

  const updateTargetName = (sourceIndexName, targetName) => {
    setSelectedIndices((previous) => {
      const current = previous[sourceIndexName];
      if (!current) {
        return previous;
      }
      return {
        ...previous,
        [sourceIndexName]: {
          ...current,
          target: {
            ...current.target,
            name: targetName,
            docs: targetIndicesMap[targetName]?.docs_count || 0,
          },
        },
      };
    });
  };

  const selectedSourceCluster = clusterMap[sourceClusterId];
  const selectedTargetCluster = clusterMap[targetClusterId];
  const effectiveTaskName =
    taskName ||
    generateName({
      cluster: {
        source: selectedSourceCluster,
        target: selectedTargetCluster,
      },
      indicesCount: selectedRowKeys.length,
    });

  const handleCreate = async () => {
    if (!selectedSourceCluster?.id) {
      message.warning(
        formatMessage({
          id: "data_tools.task.create.select_source",
          defaultMessage: "Please select a source cluster.",
        })
      );
      return;
    }

    if (!selectedTargetCluster?.id) {
      message.warning(
        formatMessage({
          id: "data_tools.task.create.select_target",
          defaultMessage: "Please select a target cluster.",
        })
      );
      return;
    }

    if (selectedItems.length === 0) {
      message.warning(
        formatMessage({
          id: "data_tools.task.create.select_indices",
          defaultMessage: "Please select at least one index.",
        })
      );
      return;
    }

    if (selectedRuntimeIds.length === 0) {
      message.warning(
        formatMessage({
          id: "data_tools.task.create.runtime",
          defaultMessage: "Please select at least one runtime gateway.",
        })
      );
      return;
    }

    const hasInvalidTarget = selectedItems.some((item) => !item.target?.name?.trim());
    if (hasInvalidTarget) {
      message.warning(
        formatMessage({
          id: "data_tools.task.create.target_index_required",
          defaultMessage: "Target index cannot be empty.",
        })
      );
      return;
    }

    const payload = buildPayload({
      name: effectiveTaskName,
      tags,
      runtimeNodes: selectedRuntimeIds
        .map((id) => runtimeInstances.find((item) => item.id === id))
        .filter(Boolean)
        .map((item) => ({
          id: item.id,
          name: item.name,
        })),
      sourceCluster: selectedSourceCluster,
      targetCluster: selectedTargetCluster,
      indices: selectedItems,
      migrationSettings,
      comparisonSettings,
    });

    try {
      setSubmitting(true);
      const response = await request(`/${kind}/data`, {
        method: "POST",
        body: payload,
      });
      if (response?.result === "created") {
        message.success(
          formatMessage({
            id: "app.message.create.success",
          })
        );
        router.push(listPath);
        return;
      }

      message.error(
        formatMessage({
          id: "app.message.create.failed",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: formatMessage({
        id: "data_tools.task.indices.source_index",
        defaultMessage: "Source Index",
      }),
      dataIndex: "index",
    },
    {
      title: formatMessage({
        id: "data_tools.task.indices.source_docs",
        defaultMessage: "Source Docs",
      }),
      dataIndex: "docs_count",
      width: 140,
      render: (value) => formatNumber(value),
    },
    {
      title: formatMessage({
        id: "data_tools.task.indices.health",
        defaultMessage: "Health",
      }),
      dataIndex: "health",
      width: 110,
      render: (value) => {
        const colorMap = {
          green: "green",
          yellow: "gold",
          red: "red",
        };
        return <Tag color={colorMap[value] || "default"}>{value || "-"}</Tag>;
      },
    },
    {
      title: formatMessage({
        id: "data_tools.task.indices.target_index",
        defaultMessage: "Target Index",
      }),
      width: 260,
      render: (_, record) => {
        const selected = selectedIndices[record.index];
        if (!selected) {
          return record.index;
        }
        return (
          <Input
            value={selected.target?.name || ""}
            onChange={(e) => updateTargetName(record.index, e.target.value)}
          />
        );
      },
    },
    {
      title: formatMessage({
        id: "data_tools.task.indices.target_docs",
        defaultMessage: "Target Docs",
      }),
      width: 140,
      render: (_, record) => {
        const selected = selectedIndices[record.index];
        const docs = selected
          ? selected.target?.docs
          : targetIndicesMap[record.index]?.docs_count;
        return formatNumber(docs);
      },
    },
  ];

  const sharedSettingsCard = (
    <Card
      title={formatMessage({
        id: "data_tools.task.create.basic_settings",
        defaultMessage: "Basic Settings",
      })}
      style={{ marginTop: 16 }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <div style={{ marginBottom: 8 }}>
            {formatMessage({
              id: "data_tools.task.name",
              defaultMessage: "Task Name",
            })}
          </div>
          <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} />
        </Col>
        <Col span={12}>
          <div style={{ marginBottom: 8 }}>
            {formatMessage({
              id: "data_tools.task.runtime",
              defaultMessage: "Runtime Gateways",
            })}
          </div>
          <Select
            mode="multiple"
            showSearch
            allowClear
            value={selectedRuntimeIds}
            loading={runtimeInstancesLoading}
            style={{ width: "100%" }}
            optionFilterProp="children"
            placeholder={formatMessage({
              id: "data_tools.task.runtime",
              defaultMessage: "Runtime Gateways",
            })}
            onChange={setSelectedRuntimeIds}
          >
            {runtimeInstances.map((item) => (
              <Select.Option key={item.id} value={item.id}>
                {item.name}
                {item.group_id ? ` (${item.group_id})` : ""}
              </Select.Option>
            ))}
          </Select>
        </Col>
      </Row>
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        {formatMessage({
          id: "data_tools.task.tags",
          defaultMessage: "Tags",
        })}
      </div>
      <Select
        mode="tags"
        value={tags}
        style={{ width: "100%" }}
        onChange={setTags}
      />
    </Card>
  );

  const migrationSettingsCard =
    kind === "migration" ? (
      <Card
        title={formatMessage({
          id: "data_tools.task.create.migration_settings",
          defaultMessage: "Migration Settings",
        })}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>Scroll Slice Size</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={migrationSettings.scroll.slice_size}
              onChange={(value) =>
                setMigrationSettings((previous) => ({
                  ...previous,
                  scroll: {
                    ...previous.scroll,
                    slice_size: value || 1,
                  },
                }))
              }
            />
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>Scroll Docs</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={migrationSettings.scroll.docs}
              onChange={(value) =>
                setMigrationSettings((previous) => ({
                  ...previous,
                  scroll: {
                    ...previous.scroll,
                    docs: value || 1,
                  },
                }))
              }
            />
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>Scroll Timeout (minutes)</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={migrationSettings.scroll.timeout}
              onChange={(value) =>
                setMigrationSettings((previous) => ({
                  ...previous,
                  scroll: {
                    ...previous.scroll,
                    timeout: value || 1,
                  },
                }))
              }
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>Bulk Slice Size</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={migrationSettings.bulk.slice_size}
              onChange={(value) =>
                setMigrationSettings((previous) => ({
                  ...previous,
                  bulk: {
                    ...previous.bulk,
                    slice_size: value || 1,
                  },
                }))
              }
            />
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>Bulk Docs</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={migrationSettings.bulk.docs}
              onChange={(value) =>
                setMigrationSettings((previous) => ({
                  ...previous,
                  bulk: {
                    ...previous.bulk,
                    docs: value || 1,
                  },
                }))
              }
            />
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>Batch Size (MB)</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={migrationSettings.bulk.store_size_in_mb}
              onChange={(value) =>
                setMigrationSettings((previous) => ({
                  ...previous,
                  bulk: {
                    ...previous.bulk,
                    store_size_in_mb: value || 1,
                  },
                }))
              }
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>Max Worker Size</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={migrationSettings.bulk.max_worker_size}
              onChange={(value) =>
                setMigrationSettings((previous) => ({
                  ...previous,
                  bulk: {
                    ...previous.bulk,
                    max_worker_size: value || 1,
                  },
                }))
              }
            />
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>Idle Timeout (seconds)</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={migrationSettings.bulk.idle_timeout_in_seconds}
              onChange={(value) =>
                setMigrationSettings((previous) => ({
                  ...previous,
                  bulk: {
                    ...previous.bulk,
                    idle_timeout_in_seconds: value || 1,
                  },
                }))
              }
            />
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>Compress Bulk Payload</div>
            <Checkbox
              checked={migrationSettings.bulk.compress}
              onChange={(e) =>
                setMigrationSettings((previous) => ({
                  ...previous,
                  bulk: {
                    ...previous.bulk,
                    compress: e.target.checked,
                  },
                }))
              }
            >
              Enabled
            </Checkbox>
          </Col>
        </Row>
      </Card>
    ) : null;

  const comparisonSettingsCard =
    kind === "comparison" ? (
      <Card
        title={formatMessage({
          id: "data_tools.task.create.comparison_settings",
          defaultMessage: "Comparison Settings",
        })}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>Dump Slice Size</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={comparisonSettings.dump.slice_size}
              onChange={(value) =>
                setComparisonSettings((previous) => ({
                  ...previous,
                  dump: {
                    ...previous.dump,
                    slice_size: value || 1,
                  },
                }))
              }
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>Dump Docs</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={comparisonSettings.dump.docs}
              onChange={(value) =>
                setComparisonSettings((previous) => ({
                  ...previous,
                  dump: {
                    ...previous.dump,
                    docs: value || 1,
                  },
                }))
              }
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>Timeout (minutes)</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={comparisonSettings.dump.timeout}
              onChange={(value) =>
                setComparisonSettings((previous) => ({
                  ...previous,
                  dump: {
                    ...previous.dump,
                    timeout: value || 1,
                  },
                }))
              }
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>Partition Size</div>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              value={comparisonSettings.dump.partition_size}
              onChange={(value) =>
                setComparisonSettings((previous) => ({
                  ...previous,
                  dump: {
                    ...previous.dump,
                    partition_size: value || 1,
                  },
                }))
              }
            />
          </Col>
        </Row>
      </Card>
    ) : null;

  return (
    <PageHeaderWrapper title={title}>
      <Card
        title={formatMessage({
          id: "data_tools.task.create.cluster_settings",
          defaultMessage: "Cluster Settings",
        })}
      >
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              {formatMessage({
                id: "data_tools.task.source_cluster",
                defaultMessage: "Source Cluster",
              })}
            </div>
            <Select
              showSearch
              style={{ width: "100%" }}
              value={sourceClusterId}
              placeholder="Select source cluster"
              optionFilterProp="children"
              onChange={setSourceClusterId}
            >
              {clusterList.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              {formatMessage({
                id: "data_tools.task.target_cluster",
                defaultMessage: "Target Cluster",
              })}
            </div>
            <Select
              showSearch
              style={{ width: "100%" }}
              value={targetClusterId}
              placeholder="Select target cluster"
              optionFilterProp="children"
              onChange={setTargetClusterId}
            >
              {clusterList.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card
        title={formatMessage({
          id: "data_tools.task.create.select_indices_title",
          defaultMessage: "Select Indices",
        })}
        style={{ marginTop: 16 }}
        extra={
          <SearchInput
            allowClear
            style={{ width: 280 }}
            value={keyword}
            placeholder={formatMessage({
              id: "data_tools.task.keyword",
              defaultMessage: "Search by keyword",
            })}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={setKeyword}
          />
        }
      >
        {!selectedTargetCluster?.id ? (
          <Alert
            type="info"
            showIcon
            message={formatMessage({
              id: "data_tools.task.create.target_cluster_hint",
              defaultMessage:
                "Select a target cluster first so the page can preview target index status.",
            })}
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Table
          rowKey="index"
          size="small"
          loading={indicesLoading}
          dataSource={filteredIndices}
          columns={columns}
          rowSelection={{
            selectedRowKeys,
            onChange: updateSelectedKeys,
          }}
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
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>

      {sharedSettingsCard}
      {migrationSettingsCard}
      {comparisonSettingsCard}

      <Card style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{effectiveTaskName}</div>
            <div style={{ color: "#999", marginTop: 4 }}>
              {formatMessage({
                id: "data_tools.task.indices_count",
                defaultMessage: "Total Indices",
              })}
              : {selectedItems.length}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => router.push(listPath)}>
              {formatMessage({ id: "form.button.cancel", defaultMessage: "Cancel" })}
            </Button>
            <Button type="primary" loading={submitting} onClick={handleCreate}>
              {formatMessage({ id: "form.button.create" })}
            </Button>
          </div>
        </div>
      </Card>
    </PageHeaderWrapper>
  );
};

export default connect(({ global }) => ({
  clusterList: global.clusterList,
}))(CreateTaskPage);
