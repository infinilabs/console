import {
  Modal,
  Card,
  Button,
  Form,
  Input,
  Switch,
  Icon,
  InputNumber,
  Divider,
  Descriptions,
  Select,
  Row,
  Col,
  message,
  Tooltip,
  Popconfirm,
} from "antd";
import { formatMessage } from "umi/locale";
import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import useFetch from "@/lib/hooks/use_fetch";
import { useGlobal } from "@/layouts/GlobalContext";
import { useCallback, useState, useMemo } from "react";
import SelectCluster from "../SelectCluster";
import SelectIndices from "../SelectIndices";
import IndicesRowDetail from "../IndicesRowDetail";
import CompareIndicesTable from "../../components/CompareIndicesTable";
import IndexEditor from "../../components/CompareIndicesTable/IndexEditor";
import styles from "../../Detail/CompareIndices/index.scss";
import { distribution } from "@/utils/utils";

const { Option } = Select;

export const FirstStep = (props) => {
  const {
    form: { getFieldDecorator },
    stepData,
    setStepData,
  } = props;

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 5 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 19 },
    },
  };

  const [distributionMap, setDistributionMap] = useState({});
  const getDistribution = (clusterID) => {
    return distributionMap?.[clusterID] || "";
  };

  const { clusterList, clusterStatus } = useGlobal();
  const [availableClusterList] = useMemo(() => {
    let clusterListNew = clusterList.filter((item) => {
      return clusterStatus?.[item.id]?.available == true;
    });
    let dMap = {};
    clusterListNew.map((item) => {
      dMap[item.id] = item.distribution;
    });
    setDistributionMap(dMap);
    return [clusterListNew];
  }, [clusterList, clusterStatus]);

  const [targetIndicesMap, setTargetIndicesMap] = useState({});

  const [clusterSelected] = useMemo(() => {
    return [stepData?.cluster || {}];
  }, [stepData?.cluster]);

  const onSourceClusterChange = (clusterID, clusterName, version) => {
    let obj = {};
    if (clusterID && clusterName) {
      obj = { id: clusterID, name: clusterName, version: version };
    }
    let newData = { cluster: { ...clusterSelected, source: obj } };
    if (clusterSelected?.source?.id && clusterID != clusterSelected.source.id) {
      newData = { ...newData, indices: [] };
    }
    setStepData({
      ...stepData,
      ...newData,
    });
  };

  const onTargetClusterChange = async (clusterID, clusterName, version) => {
    let obj = {};
    if (clusterID && clusterName) {
      obj = { id: clusterID, name: clusterName, version: version };
    }
    setStepData({
      ...stepData,
      cluster: { ...clusterSelected, target: obj },
      indices: [],
      selectedTemplates: {},
      selectedPolicies: {},
      selectedAliases: {},
    });

    if (clusterID) {
      setTargetIndicesRealtime(clusterID);
    }
  };

  const getIndicesMultiTypeDocs = async (
    sourceClusterID,
    targetClusterID,
    indexNames
  ) => {
    const res = await request(`/migration/data/_validate?type=multi_type`, {
      method: "POST",
      timeout: 60,
      body: {
        cluster: {
          source_id: sourceClusterID,
          target_id: targetClusterID,
        },
        indices: indexNames,
      },
    });
    let result = {};
    if (res.error) {
      console.log("validate cluster index multi type failed,", res);
    }
    if (res.result) {
      result = res.result;
    }

    return result;
  };

  const validateMultiType = async (indices) => {
    let indicesNew = [];
    // source cluster version compare
    if (
      (distribution.isElasticsearch(
        getDistribution(clusterSelected.source.id)
      ) &&
        clusterSelected.source.version < "8") ||
      distribution.isEasysearch(getDistribution(clusterSelected.source.id))
    ) {
      let sourceResult = await getIndicesMultiTypeDocs(
        clusterSelected.source.id,
        clusterSelected.target.id,
        indices.map((item) => {
          return item.sourceIndex;
        })
      );

      if (Object.keys(sourceResult).length > 0) {
        for (let i = 0; i < indices.length; i++) {
          let item = indices[i];
          let indexTypeMap = sourceResult?.[item.sourceIndex] || {};
          let indexTypeCount = Object.keys(indexTypeMap).length;
          if (indexTypeCount > 0) {
            for (let key in indexTypeMap) {
              let typeCount = indexTypeMap[key];
              let targetIndex = item.sourceIndex + "-" + key;
              if (
                (distribution.isElasticsearch(
                  getDistribution(clusterSelected.target.id)
                ) &&
                  clusterSelected.target.version < "6") ||
                indexTypeCount == 1
              ) {
                targetIndex = item.sourceIndex;
              }
              indicesNew.push({
                ...item,
                sourceDocuments: typeCount,
                targetIndex: targetIndex,
                sourceDocType: key,
                targetDocType: key,
              });
            }
          } else {
            indicesNew.push(indices[i]);
          }
        }
      } else {
        indicesNew = indices;
      }
    } else {
      indicesNew = indices;
    }

    // target cluster version compare
    let targetIndexNames = [];
    if (
      (distribution.isElasticsearch(
        getDistribution(clusterSelected.target.id)
      ) &&
        clusterSelected.target.version >= "8") ||
      distribution.isOpensearch(getDistribution(clusterSelected.target.id))
    ) {
      indicesNew = indicesNew.map((item) => {
        if (targetIndicesMap.hasOwnProperty(item.targetIndex)) {
          item.targetDocuments = targetIndicesMap[item.targetIndex]?.docs_count;
        }
        return { ...item, targetDocType: "" };
      });
    } else if (
      distribution.isElasticsearch(
        getDistribution(clusterSelected.target.id)
      ) &&
      clusterSelected.target.version < "6.2"
    ) {
      //Document mapping type name can't start with '_'
      indicesNew = indicesNew.map((item) => {
        let targetDocType = item.sourceDocType || "doc";
        if (item.targetDocType.indexOf("_") === 0) {
          targetDocType = item.targetDocType.substr(1);
        }
        return { ...item, targetDocType };
      });
    } else if (
      distribution.isElasticsearch(
        getDistribution(clusterSelected.target.id)
      ) &&
      clusterSelected.target.version >= "6.2" &&
      clusterSelected.target.version < "7"
    ) {
      indicesNew = indicesNew.map((item) => {
        return { ...item, targetDocType: "doc" };
      });
    } else {
      indicesNew = indicesNew.map((item, i) => {
        return { ...item, targetDocType: "_doc" };
      });
    }

    //update target cluster index docs
    indicesNew = indicesNew.map((item, i) => {
      if (clusterSelected.source.id == clusterSelected.target.id) {
        item.targetIndex = "";
        item.targetDocuments = 0;
      }
      if (targetIndicesMap.hasOwnProperty(item.targetIndex)) {
        targetIndexNames.push({ ...item, key: i });
      }
      return item;
    });

    if (targetIndexNames.length > 0) {
      let targetResult = await getIndicesMultiTypeDocs(
        clusterSelected.target.id,
        clusterSelected.source.id,
        targetIndexNames.map((item) => {
          return item.targetIndex;
        })
      );
      targetIndexNames.map((item) => {
        let i = item.key;
        if (targetResult?.[item.targetIndex]) {
          let indexTypeMap = targetResult[item.targetIndex];
          let typeCount = 0;
          if (item.targetDocType) {
            typeCount = indexTypeMap?.[item.targetDocType] || 0;
          } else {
            for (let key in indexTypeMap) {
              typeCount += indexTypeMap[key];
            }
          }
          indicesNew[i].targetDocuments = typeCount;
        } else {
          if (targetIndicesMap[item.targetIndex]?.docs_count) {
            indicesNew[i].targetDocuments =
              targetIndicesMap[item.targetIndex]?.docs_count;
          }
        }
      });
    }

    return indicesNew;
  };

  const setTargetIndicesRealtime = async (clusterID) => {
    const res = await request(`${ESPrefix}/${clusterID}/indices/realtime`, {});
    if (res && res.length > 0) {
      let obj = {};
      for (let i = 0; i < res.length; i++) {
        obj[res[i].index] = res[i];
      }
      setTargetIndicesMap(obj);
    } else {
      console.log("fetch target cluster indices failed,", res);
    }
  };

  const onDelete = (sourceIndex, sourceDocType) => {
    let newIndices = stepData.indices.filter((item) => {
      let doc_type = item.source.doc_type;
      if (doc_type === undefined) {
        doc_type = "";
      }
      if (sourceDocType === undefined) {
        sourceDocType = "";
      }
      return !(item.source.name == sourceIndex && doc_type == sourceDocType);
    });
    setStepData({ ...stepData, indices: newIndices });
  };

  const extendedColumnsRender = () => {
    return [
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        className: styles.middle,
        render: (value, record) => {
          if (
            record.targetIndex === record.sourceIndex &&
            clusterSelected.source.id === clusterSelected.target.id
          ) {
            return (
              <Tooltip title="You're comparing the index to the itself">
                <Icon
                  type="warning"
                  theme="filled"
                  style={{ color: "#EC0202", cursor: "pointer" }}
                />
              </Tooltip>
            );
          } else if (record.targetIndex == "" || record.targetIndex == "N/A") {
            return (
              <Tooltip title="Please input the target index name">
                <Icon
                  type="warning"
                  theme="filled"
                  style={{ color: "#EC0202", cursor: "pointer" }}
                />
              </Tooltip>
            );
          } else {
            return (
              <Icon
                type="check-circle"
                theme="filled"
                style={{ color: "#05B91C" }}
              />
            );
          }
        },
      },
      {
        title: formatMessage({ id: "table.field.actions" }),
        dataIndex: "",
        className: styles.middle,
        render: (_, record) => {
          return (
            <div>
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() =>
                  onDelete(record.sourceIndex, record.sourceDocType)
                }
              >
                <Icon type="delete" style={{ color: "#EC0202" }} />
              </Popconfirm>
            </div>
          );
        },
      },
    ];
  };

  const formatColumns = (columns) => {
    const extendedColumns = extendedColumnsRender();
    const index = columns.findIndex(
      (item) => item.dataIndex === "targetCluster"
    );
    if (index !== -1) {
      const { children } = columns[index];
      const cIndex = children.findIndex(
        (item) => item.dataIndex === "targetIndex"
      );
      if (cIndex !== -1) {
        const cColumn = children[cIndex];
        cColumn.render = (value, record) => {
          let targetIndicesMapTmp = JSON.parse(
            JSON.stringify(targetIndicesMap)
          );
          if (clusterSelected.source.id == clusterSelected.target.id) {
            delete targetIndicesMapTmp[record.sourceIndex];
          }
          return (
            <IndexEditor
              value={value}
              onChange={(value) => {
                const index = selectedIndices.findIndex(
                  (item) =>
                    item.sourceIndex === record.sourceIndex &&
                    item.sourceDocType === record.sourceDocType
                );
                if (index !== -1) {
                  setStepIndicesByIndex(index, "targetIndex", value);
                }
              }}
              indices={Object.values(targetIndicesMapTmp)}
            />
          );
        };
      }

      const docTypeIndex = children.findIndex(
        (item) => item.dataIndex === "targetDocType"
      );
      if (docTypeIndex !== -1) {
        const docTypeColumn = children[docTypeIndex];
        docTypeColumn.render = (value, record) =>
          (distribution.isElasticsearch(
            getDistribution(clusterSelected.target.id)
          ) &&
            clusterSelected.target.version < "8") ||
          distribution.isEasysearch(
            getDistribution(clusterSelected.target.id)
          ) ? (
            <Input
              value={value}
              onChange={(e) => {
                const docTypeIndexSub = selectedIndices.findIndex(
                  (item) =>
                    item.sourceIndex === record.sourceIndex &&
                    item.sourceDocType === record.sourceDocType
                );
                if (docTypeIndexSub !== -1) {
                  setStepIndicesByIndex(
                    docTypeIndexSub,
                    "targetDocType",
                    e.target.value
                  );
                }
              }}
            />
          ) : (
            ""
          );
      }
    }

    return columns.concat(extendedColumns);
  };

  const expandedRowRender = (record) => {
    return (
      <IndicesRowDetail
        record={record}
        setStepData={setStepData}
        cluster={stepData.cluster || {}}
      />
    );
  };

  const setStepIndicesByIndex = async (i, type, value) => {
    const newIndices = stepData.indices;
    switch (type) {
      case "targetIndex":
        newIndices[i].target.name = value;
        break;
      case "targetDocType":
        if (
          distribution.isElasticsearch(
            getDistribution(clusterSelected.target.id)
          ) &&
          clusterSelected.target.version < "6.2"
        ) {
          //Document mapping type name can't start with '_'
          if (value.indexOf("_") === 0) {
            message.warning(
              "Document mapping type name can't start with '_' in version lower than 6"
            );
            value = value.substr(1);
          }
        }
        newIndices[i].target.doc_type = value;
        break;
    }

    //update target cluster index docs
    let targetIndex = newIndices[i].target.name;
    newIndices[i].target.docs = 0;
    if (
      (distribution.isEasysearch(getDistribution(clusterSelected.target.id)) &&
        clusterSelected.target.version >= "8") ||
      distribution.isOpensearch(getDistribution(clusterSelected.target.id))
    ) {
      if (targetIndicesMap.hasOwnProperty(targetIndex)) {
        newIndices[i].target.docs = targetIndicesMap[targetIndex]?.docs_count;
      }
    } else {
      if (targetIndicesMap.hasOwnProperty(targetIndex)) {
        let targetDocType = newIndices[i].target.doc_type;
        let targetResult = await getIndicesMultiTypeDocs(
          clusterSelected.target.id,
          clusterSelected.source.id,
          [targetIndex]
        );
        if (Object.keys(targetResult).length > 0) {
          let indexTypeMap = targetResult?.[targetIndex] || {};
          let typeCount = 0;
          if (targetDocType) {
            typeCount = indexTypeMap?.[targetDocType] || 0;
          } else {
            for (let key in indexTypeMap) {
              typeCount += indexTypeMap[key];
            }
          }
          newIndices[i].target.docs = typeCount;
        }
      }
    }

    setStepData({ ...stepData, indices: [...newIndices] });
  };

  const [selectedIndices] = useMemo(() => {
    let indicesNew =
      stepData?.indices?.map((item) => {
        return {
          sourceIndex: item.source.name || "N/A",
          sourceDocType: item.source.doc_type || "",
          sourceDocuments: item.source.docs || 0,
          targetIndex: item.target.name || "N/A",
          targetDocType: item.target.doc_type || "",
          targetDocuments: item.target.docs || 0,
          targetIndexSettings: item.targetIndexSettings,
          targetIndexMappings: item.targetIndexMappings,
          source: item.source,
          target: item.target,
        };
      }) || [];
    return [indicesNew];
  }, [stepData?.indices]);

  const onIndicesChange = async (indices) => {
    if (indices.length > 0) {
      indices = await validateMultiType(indices);
      const indexNames = indices.map((index) => index.sourceIndex);
      await request(
        `/elasticsearch/${stepData.cluster.source.id}/index/${indexNames.join(
          ","
        )}/_refresh`,
        { method: "POST" }
      );
      const res = await request(
        `${ESPrefix}/${stepData.cluster.source.id}/indices/realtime`,
        {}
      );
      if (res && res.length > 0) {
        const realtimeIndices = {};
        res.map((item) => {
          realtimeIndices[item.index] = item;
        });
        indices = indices.map((index) => {
          index.sourceDocuments =
            realtimeIndices[index.sourceIndex]?.docs_count || 0;
          return index;
        });
      }
    }

    let stepDataIndexMap = {};
    if (stepData?.indices) {
      for (let i = 0; i < stepData.indices.length; i++) {
        stepDataIndexMap[
          stepData.indices[i].source.name +
            (stepData.indices[i].source?.doc_type || "")
        ] = stepData.indices[i];
      }
    }
    const newIndices = indices.map((item) => {
      let propertyKey = item.sourceIndex + (item?.sourceDocType || "");
      if (stepDataIndexMap.hasOwnProperty(propertyKey)) {
        let itemStep = stepDataIndexMap[propertyKey];
        return itemStep;
      } else {
        return {
          source: {
            name: item.sourceIndex,
            doc_type: item.sourceDocType,
            docs: item.sourceDocuments,
            init_docs: item.sourceDocuments,
          },
          target: {
            name: item.targetIndex,
            doc_type: item.targetDocType,
            docs: item.targetDocuments,
          },
        };
      }
    });
    setStepData({ ...stepData, indices: newIndices });
  };

  return (
    <Form {...formItemLayout} layout={"horizontal"}>
      <Row
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Col span={11}>
          <Card size="small" title="Source Cluster">
            <SelectCluster
              clusterID={clusterSelected?.source?.id}
              options={availableClusterList}
              onChange={onSourceClusterChange}
            />
          </Card>
        </Col>
        <Col span={2} style={{ textAlign: "center" }}>
          <Icon type="right-circle" theme="twoTone" style={{ fontSize: 28 }} />
        </Col>
        <Col span={11}>
          <Card size="small" title="Target Cluster">
            <SelectCluster
              clusterID={clusterSelected?.target?.id}
              options={availableClusterList}
              onChange={onTargetClusterChange}
            />
          </Card>
        </Col>
      </Row>
      <div style={{ marginTop: 10 }}>
        <SelectIndices
          clusterSelected={clusterSelected}
          selectedIndicesRowKeys={
            //Remove duplicate elements from the following array
            Array.from(
              new Set(
                stepData?.indices?.map((item) => {
                  return item.source.name;
                })
              )
            ) || []
          }
          onIndicesChange={onIndicesChange}
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <CompareIndicesTable
          sourceCluster={clusterSelected.source?.name || "N/A"}
          targetCluster={clusterSelected.target?.name || "N/A"}
          data={selectedIndices || []}
          formatColumns={formatColumns}
          // expandedRowRender={expandedRowRender}
        />
      </div>
    </Form>
  );
};
