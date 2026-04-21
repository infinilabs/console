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
} from "antd";
import { formatMessage } from "umi/locale";
import { useCallback, useRef, useState, useEffect } from "react";
import request from "@/utils/request";
import { SettingsEditor } from "../../SettingsEditor";
import { InitStatus } from "./enum";
import { transform as transformMappings } from "@/lib/elasticsearch/mappings";
import { transform as transformTemplate } from "@/lib/elasticsearch/template";
import { useGlobalClusters } from "@/layouts/GlobalContext";
import { SearchEngines } from "@/lib/search_engines";

export const Template = (props) => {
  const {
    form: { getFieldDecorator },
    stepData,
    setStepData,
  } = props;
  const selectedRowKeys = Object.keys(stepData.selectedTemplates || {});
  const [data, setData] = useState({
    ...stepData,
    running: false,
    optimizeRunning: false,
    selectedRowKeys,
  });
  const stopSignalRef = useRef(false);
  useEffect(() => {
    const getTemplates = async () => {
      const templateM = await request(
        `/elasticsearch/${stepData?.cluster?.source.id}/_template`
      );
      if (templateM && !templateM.error) {
        const templates = [];
        for (let k in templateM) {
          templates.push({
            name: k,
            config: templateM[k],
          });
        }
        setData((st) => {
          return {
            ...st,
            templates,
          };
        });
      }
    };
    getTemplates();
  }, []);
  const onSingleStartClick = async (record = {}) => {
    setData((st) => {
      st.templates = st.templates.map((item) => {
        if (record.name == item.name) {
          delete item["error"];
          item.initStatus = InitStatus.Running;
        }
        return item;
      });
      return {
        ...st,
      };
    });
    let tplCfg = {};
    const tplKey = record.name;
    try {
      const pls = stepData.selectedTemplates || {};
      if (pls[tplKey]) {
        tplCfg = JSON.parse(pls[tplKey]);
      } else {
        tplCfg = targetItem.config;
      }
    } catch (err) {
      console.error(err);
      return;
    }
    const res = await request(
      `/elasticsearch/${data.cluster.target.id}/_template/${tplKey}`,
      {
        method: "PUT",
        body: tplCfg,
      },
      false,
      false
    );
    setData((st) => {
      st.templates = st.templates.map((item) => {
        if (record.name == item.name) {
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
      st.templates = st.templates.map((item) => {
        delete item["error"];
        item.initStatus = InitStatus.Ready;
        return item;
      });
      return {
        ...st,
        running: true,
      };
    });
    for (let i = 0; i < data.selectedRowKeys.length; i++) {
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

      const tplKey = data.selectedRowKeys[i];
      let targetIdx, targetItem;
      data.templates.forEach((p, idx) => {
        if (p.name === tplKey) {
          targetIdx = idx;
          targetItem = p;
          return false;
        }
        return true;
      });
      if (!targetItem) {
        continue;
      }
      let tplCfg = {};
      try {
        const pls = stepData.selectedTemplates || {};
        if (pls[tplKey]) {
          tplCfg = JSON.parse(pls[tplKey]);
        } else {
          tplCfg = targetItem.config;
        }
      } catch (err) {
        console.error(err);
        continue;
      }
      if (Object.keys(tplCfg).length === 0) {
        continue;
      }
      setData((st) => {
        st.templates[targetIdx].initStatus = InitStatus.Running;
        return {
          ...st,
          templates: [...st.templates],
        };
      });
      const res = await request(
        `/elasticsearch/${data.cluster.target.id}/_template/${tplKey}`,
        {
          method: "PUT",
          body: tplCfg,
        },
        false,
        false
      );
      setData((st) => {
        const tpl = st.templates[targetIdx];
        if (res && !res.error) {
          tpl.initStatus = InitStatus.Success;
        } else {
          tpl.initStatus = InitStatus.Error;
          tpl.error = res?.error?.reason;
        }
        st.templates[targetIdx] = tpl;
        return {
          ...st,
          templates: [...st.templates],
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
  }, [data, stepData]);

  const clustersM = useGlobalClusters();
  const autoOptimizeTemplates = (templates = [], cluster = {}) => {
    const selectedTemplates = stepData.selectedTemplates || {};
    for (let i = 0; i < templates.length; i++) {
      const tpl = templates[i].config;
      const idx = data.selectedRowKeys.findIndex(
        (k) => k === templates[i].name
      );
      if (idx === -1) {
        continue;
      }
      const newTpl = autoOptimizeTemplate(tpl, cluster, clustersM);
      selectedTemplates[templates[i].name] = JSON.stringify(newTpl, "", 2);
    }
    setStepData((st) => {
      return {
        ...st,
        selectedTemplates,
      };
    });
    return templates;
  };
  const autoOptimizeClick = () => {
    autoOptimizeTemplates(data.templates, data.cluster);
  };

  const onOptimizeMappingsClick = useCallback(
    (record) => {
      setStepData((data) => {
        const templates = data.selectedTemplates || {};
        const strTemplate = templates[record.name];
        if (!strTemplate || !strTemplate.trim()) {
          return data;
        }
        let tpl = {};
        try {
          tpl = JSON.parse(strTemplate);
        } catch (err) {
          console.error(err);
        }
        const cluster = data.cluster;
        tpl = autoOptimizeTemplate(tpl, cluster, clustersM);
        templates[record.name] = JSON.stringify(tpl, "", 2);
        return {
          ...data,
          selectedTemplates: templates,
        };
      });
    },
    [clustersM]
  );

  const expandedRowRender = useCallback(
    (record) => {
      const sourceText = JSON.stringify(record.config, "", 2);
      const templates = stepData.selectedTemplates || {};
      const targetText = templates[record.name] || "";
      return (
        <>
          <AutoOptimizeButton
            onClick={() => {
              onOptimizeMappingsClick(record);
            }}
          />
          <SettingsEditor
            sourceText={sourceText}
            targetText={targetText}
            onValueChange={(v) => {
              setStepData((st) => {
                const templates = st.selectedTemplates || {};
                templates[record.name] = v;
                return {
                  ...st,
                  selectedTemplates: templates,
                };
              });
              setData((st) => {
                const isChecked = (st.selectedRowKeys || []).some(
                  (key) => key === record.name
                );
                if (isChecked) {
                  return st;
                }
                st.selectedRowKeys.push(record.name);
                return {
                  ...st,
                };
              });
            }}
          />
        </>
      );
    },
    [stepData]
  );

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setData((st) => {
        return {
          ...st,
          selectedRowKeys,
        };
      });
    },
    selectedRowKeys: data.selectedRowKeys,
  };

  return (
    <div>
      <Table
        size="small"
        columns={[
          {
            title: "Template",
            dataIndex: "name",
          },
          {
            title: "Status",
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
        dataSource={data.templates}
        rowKey={(record, index) => record.name}
        bordered={true}
        expandedRowRender={expandedRowRender}
        rowSelection={rowSelection}
      />
      <div style={{ marginTop: 15, marginBottom: 60 }}>
        <Button
          type="primary"
          loading={data.optimizeRunning}
          onClick={autoOptimizeClick}
        >
          Auto Optimize
        </Button>
        <Button
          type="primary"
          loading={data.running}
          onClick={onStartClick}
          style={{ marginLeft: 10 }}
        >
          Start
        </Button>
        <Button
          type="primary"
          disabled={!data.running}
          style={{ marginLeft: 10 }}
          onClick={() => {
            stopSignalRef.current = true;
          }}
        >
          Stop
        </Button>
      </div>
    </div>
  );
};

const autoOptimizeTemplate = (tpl = {}, cluster, clustersM = {}) => {
  let sourceVersion = cluster.source.version;
  let targetVersion = cluster.target.version;
  //rewrite version for opensearch and easysearch
  if (clustersM[cluster.target.id].distribution === SearchEngines.Easysearch) {
    targetVersion = "7.10.2";
  } else if (
    clustersM[cluster.target.id].distribution === SearchEngines.Opensearch
  ) {
    targetVersion = "8.0.0";
  }
  if (clustersM[cluster.source.id].distribution === SearchEngines.Easysearch) {
    sourceVersion = "7.10.2";
  } else if (
    clustersM[cluster.source.id].distribution === SearchEngines.Opensearch
  ) {
    sourceVersion = "8.0.0";
  }
  tpl.mappings = transformMappings(tpl.mappings, {
    sourceVersion,
    targetVersion,
  });
  tpl = transformTemplate(tpl, {
    sourceVersion,
    targetVersion,
    sourceDistribution: clustersM[cluster.source.id].distribution,
    targetDistribution: clustersM[cluster.target.id].distribution,
  });
  return tpl;
};

const AutoOptimizeButton = ({ onClick }) => {
  return (
    <div style={{ position: "absolute", zIndex: 10, right: 24 }}>
      <a onClick={onClick}>
        <Icon type="thunderbolt" />
        Auto Optimize
      </a>
    </div>
  );
};
