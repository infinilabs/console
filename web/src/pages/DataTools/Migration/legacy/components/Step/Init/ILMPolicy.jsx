import { Table, Button, Tooltip, Icon } from "antd";
import { InitStatus } from "./enum";
import { SettingsEditor } from "../../SettingsEditor";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import request from "@/utils/request";
import { transform } from "@/lib/elasticsearch/ilm";
import { useGlobalClusters } from "@/layouts/GlobalContext";
import { formatMessage } from "umi/locale";

export const ILMPolicy = (props) => {
  const {
    form: { getFieldDecorator },
    stepData,
    setStepData,
  } = props;
  const selectedRowKeys = Object.keys(stepData.selectedPolicies || {});
  const [data, setData] = useState({
    ...stepData,
    running: false,
    selectedRowKeys,
  });
  const stopSignalRef = useRef(false);
  const clustersM = useGlobalClusters();
  const optimize = (cfg) => {
    const sourceDistribution =
      clustersM[stepData.cluster.source.id].distribution;
    const targetDistribution =
      clustersM[stepData.cluster.target.id].distribution;
    return transform(cfg, { sourceDistribution, targetDistribution });
  };
  const expandedRowRender = useCallback((record) => {
    clearInvalidSettings(record.config);
    const sourceText = JSON.stringify(record.config, "", 2);
    const policies = stepData.selectedPolicies || {};
    const targetText = policies[record.name] || "";

    return (
      <SettingsEditor
        sourceText={sourceText}
        optimize={optimize}
        targetText={targetText}
        onValueChange={(v) => {
          setStepData((st) => {
            const policies = st.selectedPolicies || {};
            policies[record.name] = v;
            return {
              ...st,
              selectedPolicies: policies,
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
    );
  }, []);
  useEffect(() => {
    const getILMPolicies = async () => {
      const policyM = await request(
        `/elasticsearch/${stepData?.cluster?.source.id}/_ilm/policy`
      );
      if (policyM && !policyM.error) {
        const policies = [];
        //adapter opensearch
        if (policyM.policies) {
          policyM.policies.map((p) => {
            policies.push({
              name: p.policy.policy_id,
              config: {
                policy: p.policy,
              },
            });
            return p;
          });
        } else {
          for (let k in policyM) {
            policies.push({
              name: k,
              config: policyM[k],
            });
          }
        }

        setData((st) => {
          return {
            ...st,
            policies,
          };
        });
      }
    };
    getILMPolicies();
  }, []);

  const onStartClick = useCallback(async () => {
    setData((st) => {
      st.policies = st.policies.map((item) => {
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
      const ilmKey = data.selectedRowKeys[i];
      let targetIdx, targetItem;
      data.policies.forEach((p, idx) => {
        if (p.name === ilmKey) {
          targetIdx = idx;
          targetItem = p;
          return false;
        }
        return true;
      });
      if (!targetItem) {
        continue;
      }
      let ilmCfg = {};
      try {
        const pls = stepData.selectedPolicies || {};
        if (pls[ilmKey]) {
          ilmCfg = JSON.parse(pls[ilmKey]);
        } else {
          ilmCfg = targetItem.config;
        }
      } catch (err) {
        console.error(err);
        continue;
      }
      if (Object.keys(ilmCfg).length === 0) {
        continue;
      }
      clearInvalidSettings(ilmCfg);
      setData((st) => {
        st.policies[targetIdx].initStatus = InitStatus.Running;
        return {
          ...st,
          policies: [...st.policies],
        };
      });
      const res = await request(
        `/elasticsearch/${data.cluster.target.id}/_ilm/policy/${ilmKey}`,
        {
          method: "PUT",
          body: ilmCfg,
        },
        false,
        false
      );
      setData((st) => {
        const index = st.policies[targetIdx];
        if (res && !res.error) {
          index.initStatus = InitStatus.Success;
        } else {
          index.initStatus = InitStatus.Error;
          index.error = res?.error?.reason;
        }
        st.policies[targetIdx] = index;
        return {
          ...st,
          policies: [...st.policies],
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

  const onSingleStartClick = async (record = {}) => {
    setData((st) => {
      st.policies = st.policies.map((item) => {
        if (record.name === item.name) {
          delete item["error"];
          item.initStatus = InitStatus.Running;
        }
        return item;
      });
      return {
        ...st,
      };
    });
    let ilmCfg = {};
    try {
      const pls = stepData.selectedPolicies || {};
      if (pls[record.name]) {
        ilmCfg = JSON.parse(pls[record.name]);
      } else {
        ilmCfg = record.config;
      }
    } catch (err) {
      console.error(err);
    }
    if (Object.keys(ilmCfg).length === 0) {
      return;
    }
    clearInvalidSettings(ilmCfg);
    const res = await request(
      `/elasticsearch/${data.cluster.target.id}/_ilm/policy/${record.name}`,
      {
        method: "PUT",
        body: ilmCfg,
      },
      false,
      false
    );
    setData((st) => {
      st.policies = st.policies.map((item) => {
        if (record.name === item.name) {
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

  return (
    <div>
      <Table
        size="small"
        rowSelection={rowSelection}
        columns={[
          {
             title: formatMessage({ id: "migration.table.field.ilm_policy", defaultMessage: "ILM Policy" }),
            dataIndex: "name",
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
        dataSource={data.policies || []}
        rowKey={(record, index) => record.name}
        bordered={true}
        expandedRowRender={expandedRowRender}
      />
      <div>
        <Button type="primary" loading={data.running} onClick={onStartClick}>
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

const clearInvalidSettings = (settings = {}) => {
  ["version", "modified_date"].forEach((v) => {
    delete settings[v];
  });
};
