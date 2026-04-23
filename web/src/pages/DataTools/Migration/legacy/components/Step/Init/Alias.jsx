import { Table, Button, Tooltip, Icon } from "antd";
import { InitStatus } from "./enum";
import { SettingsEditor } from "../../SettingsEditor";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import request from "@/utils/request";
import { formatMessage } from "umi/locale";

export const Alias = (props) => {
  const {
    form: { getFieldDecorator },
    stepData,
    setStepData,
  } = props;
  const selectedRowKeys = Object.keys(stepData.selectedAliases || {});
  const [data, setData] = useState({
    ...stepData,
    running: false,
    selectedRowKeys,
  });
  const stopSignalRef = useRef(false);
  const expandedRowRender = useCallback((record) => {
    const sourceText = JSON.stringify(record.config, "", 2);
    const aliases = stepData.selectedAliases || {};
    const targetText = aliases[record.name] || "";
    return (
      <SettingsEditor
        sourceText={sourceText}
        targetText={targetText}
        onValueChange={(v) => {
          setStepData((st) => {
            const aliases = st.selectedAliases || {};
            aliases[record.name] = v;
            return {
              ...st,
              selectedAliases: aliases,
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
    const getAliases = async () => {
      const aliasesM = await request(
        `/elasticsearch/${stepData?.cluster?.source.id}/alias`
      );
      if (aliasesM && !aliasesM.error) {
        const aliases = [];
        for (let k in aliasesM) {
          const actions = [];
          aliasesM[k].indexes.forEach((item) => {
            for (let ik in item) {
              if (!item[ik]) {
                delete item[ik];
              }
            }
            actions.push({
              add: {
                ...item,
                alias: k,
              },
            });
          });
          aliases.push({
            name: k,
            config: {
              actions,
            },
          });
        }
        setData((st) => {
          return {
            ...st,
            aliases,
          };
        });
      }
    };
    getAliases();
  }, []);

  const onStartClick = useCallback(async () => {
    setData((st) => {
      st.aliases = st.aliases.map((item) => {
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
      const aliasKey = data.selectedRowKeys[i];
      let targetIdx, targetItem;
      data.aliases.forEach((p, idx) => {
        if (p.name === aliasKey) {
          targetIdx = idx;
          targetItem = p;
          return false;
        }
        return true;
      });
      if (!targetItem) {
        continue;
      }
      const item = targetItem;
      let aliasCfg = {};
      try {
        const pls = stepData.selectedAliases || {};
        if (pls[aliasKey]) {
          aliasCfg = JSON.parse(pls[aliasKey]);
        } else {
          aliasCfg = targetItem.config;
        }
      } catch (err) {
        console.error(err);
        continue;
      }
      if (Object.keys(aliasCfg).length === 0) {
        continue;
      }
      setData((st) => {
        st.aliases[targetIdx].initStatus = InitStatus.Running;
        return {
          ...st,
          aliases: [...st.aliases],
        };
      });
      const res = await request(
        `/elasticsearch/${data.cluster.target.id}/alias`,
        {
          method: "POST",
          body: aliasCfg,
        },
        false,
        false
      );
      setData((st) => {
        const alias = st.aliases[targetIdx];
        if (res && !res.error) {
          alias.initStatus = InitStatus.Success;
        } else {
          alias.initStatus = InitStatus.Error;
          alias.error = res?.error?.reason;
        }
        st.aliases[targetIdx] = alias;
        return {
          ...st,
          aliases: [...st.aliases],
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
      st.aliases = st.aliases.map((item) => {
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
    let aliasCfg = {};
    try {
      const pls = stepData.selectedAliases || {};
      if (pls[record.name]) {
        aliasCfg = JSON.parse(pls[record.name]);
      } else {
        aliasCfg = record.config;
      }
    } catch (err) {
      console.error(err);
    }
    if (Object.keys(aliasCfg).length === 0) {
      return;
    }
    const res = await request(
      `/elasticsearch/${data.cluster.target.id}/alias`,
      {
        method: "POST",
        body: aliasCfg,
      },
      false,
      false
    );
    setData((st) => {
      st.aliases = st.aliases.map((item) => {
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
             title: formatMessage({ id: "migration.table.field.alias", defaultMessage: "Alias" }),
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
        dataSource={data.aliases || []}
        rowKey={(record, index) => record.name}
        bordered={true}
        expandedRowRender={expandedRowRender}
        pagination={{
          showSizeChanger: true,
        }}
      />
      <div style={{ marginTop: data.aliases?.length == 0 ? 10 : 0 }}>
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
