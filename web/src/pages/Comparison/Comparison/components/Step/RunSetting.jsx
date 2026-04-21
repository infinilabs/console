import React, { useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  InputNumber,
  Input,
  Select,
  message,
  Switch,
  DatePicker,
} from "antd";
import moment from "moment";
import ExecuteIntervals from "../FormItem/ExecuteIntervals";
import ExecuteNodes from "../FormItem/ExecuteNodes";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";
import _ from "lodash";
import useFetch from "@/lib/hooks/use_fetch";

const formItemLayout = {
  labelCol: {
    sm: { span: 24 },
    md: { span: 8 },
  },
  wrapperCol: {
    sm: { span: 24 },
    md: { span: 8 },
  },
};

export const RunSetting = (props) => {
  const { stepData, setStepData, form, onPrevious } = props;

  const { getFieldDecorator } = form;
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [incremental, setIncremental] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    props.form.validateFields((err, values) => {
      if (err) {
        return false;
      }
      setLoading(true);

      values.settings.execution.nodes.permit = values.settings.execution.nodes.permit.map(
        (node) => ({ id: node.id, name: node.name || "" })
      );

      values.settings.dump.timeout += "m";
      if (incremental) {
        const repeat = values.settings.execution.repeat;
        values.settings.execution.repeat.interval = `${repeat.interval_number}${repeat.interval_unit}`
      }
      if (!schedule) {
        values.settings.execution.repeat.next_run_time = null;
      }

      const params = { ...stepData, settings: values.settings, name: values.name, tags: values.tags };
      setStepData(params);
      submitData(params);
    });
  };

  const submitData = async (params) => {
    //clear invalid field
    const indices = params.indices.map((item) => {
      delete item.source.init_docs;
      delete item.data_partition;
      delete item.range;
      return item;
    });

    const newVals = { ...params, indices };

    const url = "/comparison/data";
    const res = await request(url, {
      method: "POST",
      body: newVals,
    });
    if (res && res.result == "created") {
      setTimeout(() => {
        message.success(
          formatMessage({
            id: "app.message.create.success",
          })
        );
        setLoading(false);
        router.push("/data_tools/comparison");
      }, 1000);
    } else {
      setLoading(false);
      console.log("Created failed!", res);
      message.error(
        formatMessage({
          id: "app.message.create.failed",
        })
      );
    }
  };
  const [valuesState, setValuesState] = useState({});

  const { value: tagItems } = useFetch(
    `/migration/data/_search_values`,
    {
      queryParams: {
        field: "metadata.labels.tags",
        keyword: valuesState.tagsKeyword,
      },
    },
    [valuesState.tagsKeyword]
  );
  const onSearchTags = _.debounce((value) => {
    setValuesState((st) => {
      return {
        ...st,
        tagsKeyword: value,
      };
    });
  }, 500);

  return (
    <Form
      style={{ marginTop: 48 }}
      {...formItemLayout}
      onSubmit={handleSubmit}
      colon={false}
    >
      <Form.Item
        label={
          <span
            style={{
              fontWeight: 700,
              color: "rgba(87,87,87,1)",
            }}
          >
            Dump Setting
          </span>
        }
      ></Form.Item>
      <Form.Item label="Slice size">
        {getFieldDecorator("settings.dump.slice_size", {
          initialValue: stepData?.settings?.dump?.slice_size || 1,
          rules: [
            {
              required: true,
              message: "Please input slice size!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={1} />)}
      </Form.Item>
      <Form.Item label="Documents">
        {getFieldDecorator("settings.dump.docs", {
          initialValue: stepData?.settings?.dump?.docs || 1000,
          rules: [
            {
              required: true,
              message: "Please input documents!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={0} />)}
      </Form.Item>
      <Form.Item label="Timeout">
        {getFieldDecorator("settings.dump.timeout", {
          initialValue: stepData?.settings?.dump?.timeout || 5,
          rules: [
            {
              required: true,
              message: "Please input timeout!",
            },
          ],
        })(
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            formatter={(value) => `${value}m`}
            parser={(value) => value.replace("m", "")}
          />
        )}
      </Form.Item>
      <Form.Item label="Partitions">
        {getFieldDecorator("settings.dump.partition_size", {
          initialValue: stepData?.settings?.dump?.partition_size || 1,
          rules: [
            {
              required: true,
              message: "Please input partition size!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={1} />)}
      </Form.Item>
      <ExecuteNodes
        record={stepData}
        form={form}
      />
      <Form.Item label="Detect Incremental Data">
        {getFieldDecorator("settings.execution.repeat.incremental", {
          initialValue: false,
          valuePropName: 'checked',
        })(<Checkbox onChange={e => setIncremental(e.target.checked)}/>)}
      </Form.Item>
      {
        incremental &&
        <Form.Item label="Detect Interval">
          <Input.Group compact style={{ width: "100%" }}>
            {getFieldDecorator("settings.execution.repeat.interval_number", {
              initialValue: 15,
            })(
              <InputNumber
                style={{ width: "calc(100% - 120px)" }}
                min={0}
              />
            )}
            {getFieldDecorator("settings.execution.repeat.interval_unit", {
              initialValue: 'm',
            })(
              <Select style={{ width: 120 }}>
                <Option value="h">hours</Option>
                <Option value="m">minutes</Option>
              </Select>
            )}
          </Input.Group>
        </Form.Item>
      }
      <Form.Item label="Auto Start">
        {getFieldDecorator("settings.execution.repeat.schedule", {
          initialValue: stepData?.settings?.execution?.repeat?.next_run_time || false,
          valuePropName: 'checked',
        })(<Checkbox onChange={e => setSchedule(e.target.checked)}/>)}
      </Form.Item>
      {
        schedule &&
        <Form.Item label="Next Run Time">
          {getFieldDecorator("settings.execution.repeat.next_run_time", {
            initialValue: stepData?.settings?.execution?.repeat?.next_run_time || moment(),
          })(<DatePicker showTime placeholder="Next Run Time" />)}
        </Form.Item>
      }
      <ExecuteIntervals record={stepData} form={form} />
      <Form.Item label="Task Name">
        {getFieldDecorator("name", {
          initialValue: stepData?.name || '',
          rules: [
            {
              required: true,
              message: "Please input task name!",
            },
          ],
        })(<Input />)}
      </Form.Item>
      <Form.Item
          label="Tags"
        >
        {getFieldDecorator(`tags`, {
          initialValue: stepData?.tags,
          rules: [],
        })(
          <Select
            allowClear
            showSearch
            placeholder="Input or select tags"
            mode="tags"
            onSearch={onSearchTags}
          >
            {(_.isArray(tagItems) ? tagItems : []).map((item) => {
              return (
                <Select.Option key={item} value={item}>
                  {item}
                </Select.Option>
              );
            })}
          </Select>
        )}
      </Form.Item>
      <Form.Item label=" ">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button
            style={{ width: "50%" }}
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            Create Task
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};
