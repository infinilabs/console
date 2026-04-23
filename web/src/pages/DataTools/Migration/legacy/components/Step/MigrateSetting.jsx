import React, { forwardRef, useEffect, useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Icon,
  Input,
  InputNumber,
  Select,
  Table,
} from "antd";
import styles from "./MigrateSetting.scss";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { ESPrefix } from "@/services/common";
import moment from "moment";
import IndicesFilterDrawer from "../IndicesFilterDrawer";
import { Switch } from "antd/lib";

const { Option } = Select;

export const MigrateSetting = (props) => {
  const { stepData, setStepData, form, onPrevious, onSubmit } = props;

  const clusterID = stepData.cluster.source.id;
  const loading = false;

  const [data, setData] = useState(stepData.indices);

  const onDataSettingChange = (record) => {
    const newData = [...data];
    const index = newData.findIndex((item) => {
      return (
        item.source.name === record.source.name &&
        item.source.doc_type === record.source.doc_type
      );
    });
    if (index !== -1) {
      newData[index] = record;
      setData(newData);

      setStepData({ ...stepData, indices: newData });
    }
  };

  const columns = [
    {
      title: "Source Index",
      dataIndex: "source.name",
    },
    {
      title: "Source Type",
      dataIndex: "source.doc_type",
    },
    {
      title: "Documents",
      dataIndex: "source.docs",
      render: (value) =>
        value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 0,
    },
    {
      title: "Range",
      dataIndex: "range",
      render: (value, record) => {
        const text = value || "all";
        return (
          <>
            <span className={text === "all" ? "" : styles.partial}>
              {text.slice(0, 1).toUpperCase() + text.slice(1)}
            </span>
            <IndicesFilterDrawer
              clusterID={clusterID}
              record={record}
              onChange={onDataSettingChange}
            />
          </>
        );
      },
    },
    {
      title: "Partition",
      dataIndex: "data_partition",
      render: (value, record) => (
        <>
          <span>{value}</span>
          <DataPartition
            clusterID={clusterID}
            record={record}
            onChange={onDataSettingChange}
          />
        </>
      ),
    },
    {
      title: "Incremental",
      dataIndex: "incremental",
      render: (value, record) => (
        <>
          <span>{ value ? `${value.field_name}, ${value.delay}` : '' }</span>
          <DataIncremental
            clusterID={clusterID}
            record={record}
            onChange={onDataSettingChange}
          />
        </>
      ),
    },
  ];

  return (
    <div className={styles.migrateSettingTable}>
      <Table
        loading={loading}
        size="small"
        columns={columns}
        dataSource={data}
        bordered={true}
        pagination={false}
        rowKey={(record, index) => {
          return `${record?.source?.name || ""}:${record?.source?.doc_type || ""}:${record?.target?.name || ""}:${record?.target?.doc_type || ""}:${index}`;
        }}
      />
    </div>
  );
};

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 7 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 17 },
  },
};

const Step = forwardRef(({ fieldType, value, onChange }, ref) => {
  const isDate = fieldType === "date";

  const onNumberChange = (v) => {
    let step;
    if (isDate) {
      step = `${v}${unit}`;
    } else {
      step = `${v}`;
    }
    onChange(step);
  };

  const onUnitChange = (v) => {
    let step;
    const formatNumber = Number.isInteger(number) ? number : 0;
    onChange(`${formatNumber}${v}`);
  };

  const formatValue = useMemo(() => {
    if (!value) return {};
    if (isDate) {
      let unit = value.slice(value.length - 1);
      let number;
      if (Number.isInteger(Number(unit))) {
        unit = "M";
        number = Number(value);
      } else {
        number = Number(value.slice(0, value.length - 1));
      }
      return { number, unit };
    } else {
      return {
        number: Number(value),
      };
    }
  }, [value, isDate]);

  const { number = 1, unit = "M" } = formatValue;

  const numberItem = (
    <InputNumber
      style={{ width: isDate ? "calc(100% - 120px)" : "100%" }}
      min={0}
      value={number}
      onChange={(v) => onNumberChange(v)}
    />
  );

  return (
    <span ref={ref}>
      {isDate ? (
        <Input.Group compact style={{ width: "100%" }}>
          {numberItem}
          <Select style={{ width: 120 }} value={unit} onChange={onUnitChange}>
            <Option value="M">months</Option>
            <Option value="w">weeks</Option>
            <Option value="d">days</Option>
            <Option value="h">hours</Option>
            <Option value="m">minutes</Option>
          </Select>
        </Input.Group>
      ) : (
        numberItem
      )}
    </span>
  );
});

const Delay = forwardRef(({ value, onChange }, ref) => {
  const onNumberChange = (v) => {
    const formatNumber = Number.isInteger(v) ? v : 0;
    let step = `${formatNumber}${unit}`
    onChange(step);
  };

  const onUnitChange = (v) => {
    const formatNumber = Number.isInteger(number) ? number : 0;
    let step = `${formatNumber}${v}`
    onChange(step);
  };

  const formatValue = useMemo(() => {
    if (!value) return {};
    let unit = value.slice(value.length - 1);
    let number = Number(value.slice(0, value.length - 1));
    return { number, unit };
  }, [value]);

  const { number = 1, unit = "h" } = formatValue;

  const numberItem = (
    <InputNumber
      style={{ width: "calc(100% - 120px)" }}
      min={0}
      value={number}
      onChange={(v) => onNumberChange(v)}
    />
  );

  return (
    <span ref={ref}>
      <Input.Group compact style={{ width: "100%" }}>
        {numberItem}
        <Select style={{ width: 120 }} value={unit} onChange={onUnitChange}>
          <Option value="h">hours</Option>
          <Option value="m">minutes</Option>
        </Select>
      </Input.Group>
    </span>
  );
});


const DataPartition = Form.create()(({ clusterID, record, onChange, form }) => {
  const [visible, setVisible] = useState(false);
  const [fieldType, setFieldType] = useState(
    record?.partition?.field_type || "date"
  );
  const [fieldName, setFieldName] = useState(
    record?.partition?.field_name || ""
  );
  const [step, setStep] = useState(record?.partition?.step || "1M");
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fields, setFields] = useState([]);

  const [previewloading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState();

  const handleSubmit = async (e) => {
    e.preventDefault();
    fetchPreview((data) => {
      onChange({
        ...record,
        partition: {
          field_type: fieldType,
          field_name: fieldName,
          step: (fieldType === "number" && useEvenStrategy === true)? parseInt(100/partitionNumbers) : step,
          use_even_strategy: useEvenStrategy,
        },
        data_partition: data.length,
      });
      setVisible(false);
      setPreview(undefined);
    });
  };

  const fetchFields = async (clusterID, index, fieldType) => {
    try {
      setFieldsLoading(true);
      const res = await request(
        `${ESPrefix}/${clusterID}/view/_fields_for_wildcard?pattern=${index}&type=${fieldType}`,
        {
          method: "GET",
        }
      );
      setFields(res?.fields?.map((item) => item.name) || []);
    } catch (error) {
    } finally {
      setFieldsLoading(false);
    }
  };

  const fetchPreview = async (callback) => {
    if (
      !clusterID ||
      !record.source.name ||
      !fieldType ||
      !fieldName ||
      !step
    ) {
      return;
    }
    try {
      setPreviewLoading(true);
      const body= {
        field_type: fieldType,
        field_name: fieldName,
        step: (fieldType === "number" && useEvenStrategy === true)? parseInt(100/partitionNumbers): step,
        filter:
          record?.raw_filter && Object.keys(record.raw_filter).length > 0
            ? record.raw_filter
            : null,
        doc_type: record.source?.doc_type,
        use_even_strategy: useEvenStrategy,
      };
      const res = await request(
        `${ESPrefix}/${clusterID}/index/${record.source.name}/_partition`,
        {
          method: "POST",
          body,
        }
      );
      const newPreview = Array.isArray(res) ? res : [];
      setPreview(newPreview);
      if (callback) callback(newPreview);
    } catch (error) {
    } finally {
      setPreviewLoading(false);
    }
  };

  const { getFieldDecorator } = form;

  useEffect(() => {
    if (clusterID && record.source.name && fieldType) {
      fetchFields(clusterID, record.source.name, fieldType);
    }
  }, [clusterID, record.source.name, fieldType]);

  const [useEvenStrategy, setUseEvenStrategy] = useState(record?.partition?.use_even_strategy || false);
  const [partitionNumbers, setPartitionNumbers] = useState(10);

  return (
    <>
      <a onClick={() => setVisible(true)}>
        <Icon type="edit" theme="filled" style={{ marginLeft: 12 }} />
      </a>
      <Drawer
        title={"Partition"}
        width={640}
        placement="right"
        onClose={() => setVisible(false)}
        visible={visible}
        destroyOnClose
      >
        <div className={styles.form}>
          <Form {...formItemLayout} onSubmit={handleSubmit} colon={false}>
            <Form.Item label="Field Type">
              {getFieldDecorator("field_type", {
                initialValue: record?.partition?.field_type,
                rules: [
                  {
                    required: true,
                    message: "Please select field type!",
                  },
                ],
              })(
                <Select
                  placeholder="field type"
                  onChange={(value) => {
                    let stepDefault = value == "date" ? "1M" : 1000;
                    setPreview(undefined);
                    setFieldType(value);
                    setFieldName(undefined);
                    setStep(stepDefault);
                    form.setFieldsValue({
                      field_name: undefined,
                      step: stepDefault,
                    });
                  }}
                >
                  {["date", "number"].map((item) => (
                    <Select.Option key={item} value={item}>
                      {item}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
            <Form.Item label="Field Name">
              {getFieldDecorator("field_name", {
                initialValue: record?.partition?.field_name,
                rules: [
                  {
                    required: true,
                    message: "Please select field name!",
                  },
                ],
              })(
                <Select
                  placeholder="field name"
                  loading={fieldsLoading}
                  onChange={(value) => {
                    setFieldName(value);
                    setPreview(undefined);
                  }}
                >
                  {fields.map((item) => (
                    <Select.Option key={item} value={item}>
                      {item}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
            {fieldType === "number" && <Form.Item label="Use even strategy">
              {getFieldDecorator("use_even_strategy", {
                initialValue: record?.partition?.use_even_strategy,
              })(
                <Switch
                  size="small"
                  onChange={(value) => {
                    setUseEvenStrategy(value);
                  }}
                />
                  
              )}
            </Form.Item>
            }
             {fieldType === "number" && useEvenStrategy === true ? (
              <Form.Item label="Number Of Partitions">
                {getFieldDecorator("numbers", {
                  initialValue: record?.partition?.numbers || partitionNumbers,
                  rules: [
                    {
                      required: true,
                      message: "Please input partition numbers!",
                    },
                  ],
                })(
                  <InputNumber
                  min={0}
                  max={100}
                  onChange={(v) => {
                    setPreview(undefined);
                    setPartitionNumbers(v);
                  }}
                />
                )}
              </Form.Item>
            ):(
              <Form.Item label="Step">
                {getFieldDecorator("step", {
                  initialValue: record?.partition?.step,
                  rules: [
                    {
                      required: true,
                      message: "Please select step!",
                    },
                  ],
                })(
                  <Step
                    fieldType={fieldType}
                    onChange={(v) => {
                      setPreview(undefined);
                      setStep(v);
                    }}
                  />
                )}
              </Form.Item>
            )}
            {preview && (
              <PartitionPreview
                loading={previewloading}
                data={preview}
                fieldType={fieldType}
                fieldName={fieldName}
              />
            )}
            <Form.Item label=" ">
              <div style={{ textAlign: "right", marginTop: 30 }}>
                <Button onClick={fetchPreview}>Preview</Button>
                <Button
                  loading={previewloading}
                  style={{ marginLeft: 12 }}
                  type="primary"
                  htmlType="submit"
                >
                  Save
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </Drawer>
    </>
  );
});

const DataIncremental = Form.create()(({ clusterID, record, onChange, form }) => {
  const [visible, setVisible] = useState(false);
  const [fieldName, setFieldName] = useState(
    record?.incremental?.field_name || ""
  );
  const [delay, setDelay] = useState(record?.incremental?.delay || "15m");
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fields, setFields] = useState([]);

  const fetchFields = async (clusterID, index) => {
    try {
      setFieldsLoading(true);
      const res = await request(
        `${ESPrefix}/${clusterID}/view/_fields_for_wildcard?pattern=${index}&type=date`,
        {
          method: "GET",
        }
      );
      setFields(res?.fields?.map((item) => item.name) || []);
    } catch (error) {
    } finally {
      setFieldsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onChange({
      ...record,
      incremental: {
        field_name: fieldName,
        delay: delay,
      },
    });
    setVisible(false);
  };

  const { getFieldDecorator } = form;
  const fieldType = "date";

  useEffect(() => {
    if (clusterID && record.source.name) {
      fetchFields(clusterID, record.source.name, fieldType);
    }
  }, [clusterID, record.source.name]);

  return (
    <>
      <a onClick={() => setVisible(true)}>
        <Icon type="edit" theme="filled" style={{ marginLeft: 12 }} />
      </a>
      <Drawer
        title={"Incremental"}
        width={640}
        placement="right"
        onClose={() => setVisible(false)}
        visible={visible}
        destroyOnClose
      >
        <div className={styles.form}>
          <Form {...formItemLayout} onSubmit={handleSubmit} colon={false}>
            <Form.Item label="Field Name">
              {getFieldDecorator("field_name", {
                initialValue: record?.incremental?.field_name,
                rules: [
                  {
                    required: true,
                    message: "Please select field name!",
                  },
                ],
              })(
                <Select
                  placeholder="field name"
                  loading={fieldsLoading}
                  onChange={(value) => {
                    setFieldName(value);
                  }}
                >
                  {fields.map((item) => (
                    <Select.Option key={item} value={item}>
                      {item}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
            {fieldName && (
              <Form.Item label="Delay">
                {getFieldDecorator("delay", {
                  initialValue: record?.incremental?.delay || '15m',
                })(
                  <Delay
                    onChange={(v) => {
                      setDelay(v);
                    }}
                  />
                )}
              </Form.Item>
            )}
            <Form.Item label=" ">
              <div style={{ textAlign: "right", marginTop: 30 }}>
                <Button
                  style={{ marginLeft: 12 }}
                  type="primary"
                  htmlType="submit"
                >
                  Save
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </Drawer>
    </>
  );
});

const PartitionPreview = ({ loading, data, fieldType, fieldName }) => {
  const isDate = fieldType === "date";

  const formatValue = (value) => {
    if (!value) return value;
    return isDate ? moment(value).format("YYYY-MM-DD HH:mm:ss") : value;
  };

  let otherItem = {};
  let dataNew = [];
  data.map((item) => {
    if (item.other) {
      otherItem = item;
    } else {
      dataNew.push(item);
    }
  });

  return (
    <div className={styles.preview}>
      <Descriptions title="Task Preview" column={1} bordered size="small">
        <Descriptions.Item label="Documents">
          {data.reduce((count, item) => count + item.docs, 0)}
        </Descriptions.Item>
        <Descriptions.Item label="Partition">{data.length}</Descriptions.Item>
        <Descriptions.Item label="Min Value">
          {formatValue(dataNew[0]?.start)}
        </Descriptions.Item>
        <Descriptions.Item label="Max Value">
          {formatValue(dataNew[dataNew.length - 1]?.end)}
        </Descriptions.Item>
      </Descriptions>

      {otherItem?.other ? (
        <div style={{ paddingTop: 10 }}>
          <Icon type="info-circle" theme="twoTone" />
          <strong> {otherItem.docs} </strong>documents without filter fields
          have been divided into 1 partition.
        </div>
      ) : null}
      <div className={styles.title}>Partition Preview</div>
      <Table
        size="small"
        loading={loading}
        columns={[
          {
            title: "Start",
            dataIndex: "start",
            render: (value, record) =>
              !record.other ? formatValue(value) : "-",
          },
          {
            title: "End",
            dataIndex: "end",
            render: (value, record) =>{
              let ret = "-"
              if(!record.other){
                ret = formatValue(value);
                if(!record.include_end){
                  ret = "<" + ret;
                }
              }
              return ret;
            },
          },
          {
            title: "Documents",
            dataIndex: "docs",
          },
        ]}
        dataSource={data}
        rowKey={(record, index) => index}
        bordered={true}
        pagination={false}
      />
    </div>
  );
};
