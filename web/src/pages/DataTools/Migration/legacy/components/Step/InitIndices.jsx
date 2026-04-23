import {
  Form,
  Input,
  Switch,
  Icon,
  InputNumber,
  Divider,
  Descriptions,
  Select,
  Drawer,
  Table,
  Button,
  Tooltip,
  message,
} from "antd";
import { formatMessage } from "umi/locale";
import { useCallback, useRef, useState } from "react";
import request from "@/utils/request";
import IndicesRowDetail from "../IndicesRowDetail";
import { transform } from "@/lib/elasticsearch/mappings";
import { useGlobalClusters } from "@/layouts/GlobalContext";
import { SearchEngines } from "@/lib/search_engines";
import { applyEasysearchMigrationIndexSettings } from "../../utils/indexSettings";

export const InitIndices = (props) => {
  const {
    form: { getFieldDecorator },
    stepData,
    setStepData,
  } = props;
  const [data, setData] = useState({
    ...stepData,
    running: false,
    optimizeRunning: false,
  });
  const stopSignalRef = useRef(false);
  const onSingleStartClick = async (record = {}) => {
    setData((st) => {
      st.indices = st.indices.map((item) => {
        if (
          record.target.name == item.target.name &&
          record.target.doc_type == item.target.doc_type
        ) {
          delete item["error"];
          item.initStatus = InitStatus.Running;
        }
        return item;
      });
      return {
        ...st,
      };
    });
    const body = {};
    try {
      record.targetIndexSettings &&
        (body.settings = JSON.parse(record.targetIndexSettings));
      record.targetIndexMappings &&
        (body.mappings = JSON.parse(record.targetIndexMappings));
    } catch (err) {
      console.log(err);
    }
    const res = await request(
      `/elasticsearch/${data.cluster.target.id}/index/${record.target.name}/_init`,
      {
        method: "POST",
        body: body,
      },
      false,
      false
    );
    setData((st) => {
      st.indices = st.indices.map((item) => {
        if (
          record.target.name == item.target.name &&
          record.target.doc_type == item.target.doc_type
        ) {
          if (res && !res.error) {
            item.initStatus = InitStatus.Success;
          } else {
            item.initStatus = InitStatus.Error;
            item.error = res?.error?.reason;
          }
        }
        return item;
      });

      return {
        ...st,
      };
    });
  };
  const onStartClick = useCallback(async () => {
    setData((st) => {
      st.indices = st.indices.map((item) => {
        delete item["error"];
        item.initStatus = InitStatus.Ready;
        return item;
      });
      return {
        ...st,
        running: true,
      };
    });
    for (let i = 0; i < data.indices.length; i++) {
      const item = data.indices[i];
      if (stopSignalRef.current === true) {
        setData((st) => {
          return {
            ...st,
            running: false,
          };
        });
        stopSignalRef.current = false;
        return false;
      }

      const body = {};
      try {
        item.targetIndexSettings &&
          (body.settings = JSON.parse(item.targetIndexSettings));
        item.targetIndexMappings &&
          (body.mappings = JSON.parse(item.targetIndexMappings));
      } catch (err) {
        console.log(err);
      }
      if (Object.keys(body).length === 0) {
        setData((st) => {
          st.indices[i].initStatus = InitStatus.Skipped;
          return {
            ...st,
            indices: [...st.indices],
          };
        });
        continue;
      }
      setData((st) => {
        st.indices[i].initStatus = InitStatus.Running;
        return {
          ...st,
          indices: [...st.indices],
        };
      });
      const res = await request(
        `/elasticsearch/${data.cluster.target.id}/index/${item.target.name}/_init`,
        {
          method: "POST",
          body: body,
        },
        false,
        false
      );
      setData((st) => {
        const index = st.indices[i];
        if (res && !res.error) {
          index.initStatus = InitStatus.Success;
        } else {
          index.initStatus = InitStatus.Error;
          index.error = res?.error?.reason;
        }
        st.indices[i] = index;
        return {
          ...st,
          indices: [...st.indices],
        };
      });
    }
    setData((st) => {
      return {
        ...st,
        running: false,
      };
    });
    stopSignalRef.current = false;
  }, [data]);

  const clustersM = useGlobalClusters();
  const isEasysearchTarget =
    clustersM?.[data.cluster?.target?.id]?.distribution === SearchEngines.Easysearch;

  const applyEasysearchParamsToAllIndices = useCallback(() => {
    let invalidCount = 0;
    const nextIndices = data.indices.map((item) => {
      let settings = {};
      try {
        settings = item.targetIndexSettings?.trim()
          ? JSON.parse(item.targetIndexSettings)
          : {};
      } catch (err) {
        console.error(err);
        invalidCount += 1;
        return item;
      }
      return {
        ...item,
        targetIndexSettings: JSON.stringify(
          applyEasysearchMigrationIndexSettings(settings),
          "",
          2
        ),
      };
    });

    setData((st) => ({
      ...st,
      indices: nextIndices,
    }));
    setStepData((st) => ({
      ...st,
      indices: nextIndices,
    }));

    if (invalidCount > 0) {
      message.warning(
        formatMessage(
          {
            id: "migration.message.easysearch_params_partial",
            defaultMessage:
              "Added parameters to {count} indices. {invalidCount} indices were skipped because their settings JSON is invalid.",
          },
          {
            count: nextIndices.length - invalidCount,
            invalidCount,
          }
        )
      );
      return;
    }

    message.success(
      formatMessage(
        {
          id: "migration.message.easysearch_params_bulk_added",
          defaultMessage:
            "Added compression and source reuse parameters to {count} indices.",
        },
        { count: nextIndices.length }
      )
    );
  }, [data.indices, setStepData]);
  const autoOptimizeIndices = async (indices = [], cluster = {}) => {
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      let sourceVersion = cluster.source.version;
      let targetVersion = cluster.target.version;
      //rewrite version for opensearch and easysearch
      if (
        clustersM[cluster.target.id].distribution === SearchEngines.Easysearch
      ) {
        targetVersion = "7.10.2";
      } else if (
        clustersM[cluster.target.id].distribution === SearchEngines.Opensearch
      ) {
        targetVersion = "8.0.0";
      }
      if (
        clustersM[cluster.source.id].distribution === SearchEngines.Easysearch
      ) {
        sourceVersion = "7.10.2";
      } else if (
        clustersM[cluster.source.id].distribution === SearchEngines.Opensearch
      ) {
        sourceVersion = "8.0.0";
      }
      const targetIndexInfo = await autoOptimizeIndex(
        cluster.source?.id,
        index.source.name,
        sourceVersion,
        targetVersion,
        index.target.doc_type
      );
      if (
        clustersM[cluster.source.id].distribution ===
          SearchEngines.Elasticsearch &&
        clustersM[cluster.target.id].distribution != SearchEngines.Elasticsearch
      ) {
        if (targetIndexInfo.settings.index?.lifecycle) {
          delete targetIndexInfo.settings.index["lifecycle"];
        }
      }
      index.targetIndexMappings = JSON.stringify(
        targetIndexInfo.mappings,
        "",
        2
      );
      index.targetIndexSettings = JSON.stringify(
        targetIndexInfo.settings,
        "",
        2
      );
    }
    return indices;
  };
  const autoOptimizeClick = async () => {
    setData((st) => {
      return {
        ...st,
        optimizeRunning: true,
      };
    });
    const indices = await autoOptimizeIndices(data.indices, data.cluster);
    setData((st) => {
      return {
        ...st,
        optimizeRunning: false,
        indices: [...indices],
      };
    });
  };

  const expandedRowRender = useCallback(
    (record) => {
      return (
        <IndicesRowDetail
          record={record}
          setStepData={setStepData}
          cluster={stepData.cluster}
        />
      );
    },
    [stepData]
  );
  return (
    <div>
      <Table
        size="small"
        columns={[
          {
             title: formatMessage({ id: "migration.table.field.target_index", defaultMessage: "Target Index" }),
            dataIndex: "target.name",
          },
          {
             title: formatMessage({ id: "migration.table.field.target_type", defaultMessage: "Target Type" }),
            dataIndex: "target.doc_type",
          },
          {
             title: formatMessage({ id: "migration.table.field.status" }),
            dataIndex: "initStatus",
            render: (text, record) => {
              const status = text || InitStatus.Ready;
              let color = "";
              if (status === InitStatus.Error) {
                color = "red";
              } else if (status === InitStatus.Success) {
                color = "green";
              }
              return (
                <div>
                  <span style={{ color }}>{status}</span>{" "}
                  {record.error ? (
                    <Tooltip title={record.error}>
                      <Icon type="info-circle-o" />
                    </Tooltip>
                  ) : null}
                </div>
              );
            },
          },
          {
            title: formatMessage({ id: "table.field.actions" }),
            render: (_, record) => {
              return record.error ? (
                <div>
                  <Button
                    type="primary"
                    onClick={() => {
                      onSingleStartClick(record);
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : null;
            },
          },
        ]}
        dataSource={data.indices}
        rowKey={(record, index) => index}
        bordered={true}
        pagination={false}
        expandedRowRender={expandedRowRender}
      />
      <div style={{ marginTop: 15, marginBottom: 60 }}>
        <Button
          type="primary"
          loading={data.optimizeRunning}
          onClick={autoOptimizeClick}
        >
          {formatMessage({
            id: "migration.button.auto_optimize",
            defaultMessage: "Auto Optimize",
          })}
        </Button>
        {isEasysearchTarget ? (
          <Button
            type="default"
            onClick={applyEasysearchParamsToAllIndices}
            style={{ marginLeft: 10 }}
          >
            {formatMessage({
              id: "migration.button.add_easysearch_params",
              defaultMessage: "Add Compression Params",
            })}
          </Button>
        ) : null}
        <Button
          type="primary"
          loading={data.running}
          onClick={onStartClick}
          style={{ marginLeft: 10 }}
        >
          {formatMessage({
            id: "migration.button.start",
            defaultMessage: "Start",
          })}
        </Button>
        <Button
          type="primary"
          disabled={!data.running}
          style={{ marginLeft: 10 }}
          onClick={() => {
            stopSignalRef.current = true;
          }}
        >
          {formatMessage({
            id: "migration.button.stop",
            defaultMessage: "Stop",
          })}
        </Button>
      </div>
    </div>
  );
};

const InitStatus = {
  Ready: "ready",
  Running: "running",
  Error: "error",
  Success: "success",
  Skipped: "skipped",
};

const autoOptimizeIndex = async (
  clusterID,
  indexName,
  sourceVersion = "",
  targetVersion = "",
  targetDocType
) => {
  const sourceIndexInfo = await request(
    `/elasticsearch/${clusterID}/index/${indexName}`
  );
  const targetIndexInfo = {};
  if (sourceIndexInfo && sourceIndexInfo[indexName]) {
    const indexSettings = sourceIndexInfo[indexName].settings?.index || {};
    ["creation_date", "provided_name", "uuid", "version"].forEach((v) => {
      delete indexSettings[v];
    });
    targetIndexInfo["mappings"] = transform(
      sourceIndexInfo[indexName].mappings,
      {
        sourceVersion,
        targetVersion,
        targetDocType,
      }
    );
    targetIndexInfo["settings"] = sourceIndexInfo[indexName].settings;
    targetIndexInfo["settings"].index = _.merge(indexSettings, {
      number_of_replicas: 0,
      refresh_interval: "-1",
      translog: {
        durability: "async",
        flush_threshold_size: "500mb",
      },
    });
    return targetIndexInfo;
  }
  return targetIndexInfo;
};
