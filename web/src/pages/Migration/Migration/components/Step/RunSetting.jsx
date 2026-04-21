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
import ExecuteNodes from "../../../../Comparison/Comparison/components/FormItem/ExecuteNodes";
import request from "@/utils/request";
import { router } from "umi";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import _ from "lodash";

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
  const [skipbulkcountcheck,setSkipbulkcountcheck] = useState(false);
  const [skipExistDocs,setSkipExistDocs] = useState(false);
  const [bulkOperation,setBulkOperation] = useState("index");

  const handleSubmit = (e) => {
    e.preventDefault();
    props.form.validateFields((err, values) => {
      if (err) {
        return false;
      }
      setLoading(true);

      values.settings.execution.nodes.permit = values.settings.execution.nodes.permit.map(
        (node) => ({ id: node.id, name: node.name })
      );

      values.settings.scroll.timeout += "m";

      if (incremental) {
        const repeat = values.settings.execution.repeat;
        values.settings.execution.repeat.interval = `${repeat.interval_number}${repeat.interval_unit}`
      }
      if (!schedule) {
        values.settings.execution.repeat.next_run_time = null;
      }
      values.settings.bulk.operation = bulkOperation
      values.settings.skip_bulk_count_check = skipbulkcountcheck
      const params = { ...stepData, settings: values.settings, name: values.name, tags: values.tags };
      setStepData(params);
      submitData(params);
    });
  };

  const submitData = async (params) => {
    //clear invalid field
    const indices = params.indices.map((item) => {
      delete item.source.init_docs;
      delete item.target.docs;
      delete item.data_partition;
      delete item.range;
      return item;
    });

    const newVals = { ...params, indices };

    const url = "/migration/data";
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
        router.push("/data_tools/migration");
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
      {/* <Form.Item label="Parallel Migration Indices">
        {getFieldDecorator("settings.parallel_indices", {
          initialValue: stepData?.settings?.parallel_indices || 1,
          rules: [
            {
              required: true,
              message: "Please select parallel indices!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={1} />)}
      </Form.Item>
      <Form.Item label="Parallel Tasks(per index)">
        {getFieldDecorator("settings.parallel_task_per_index", {
          initialValue: stepData?.settings?.parallel_task_per_index || 1,
          rules: [
            {
              required: true,
              message: "Please select parallel tasks(per index)!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={1} />)}
      </Form.Item> */}
      <Form.Item
        label={
          <span
            style={{
              fontWeight: 700,
              color: "rgba(87,87,87,1)",
            }}
          >
            Scroll Setting
          </span>
        }
      ></Form.Item>
      <Form.Item label="Slice size">
        {getFieldDecorator("settings.scroll.slice_size", {
          initialValue: stepData?.settings?.scroll?.slice_size || 1,
          rules: [
            {
              required: true,
              message: "Please input slice size!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={1} />)}
      </Form.Item>
      <Form.Item label="Documents">
        {getFieldDecorator("settings.scroll.docs", {
          initialValue: stepData?.settings?.scroll?.docs || 1000,
          rules: [
            {
              required: true,
              message: "Please input documents!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={0} />)}
      </Form.Item>
      <Form.Item label="Timeout">
        {getFieldDecorator("settings.scroll.timeout", {
          initialValue: stepData?.settings?.scroll?.timeout || 5,
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
      <Form.Item
        label={
          <span
            style={{
              fontWeight: 700,
              color: "rgba(87,87,87,1)",
            }}
          >
            Bulk Setting
          </span>
        }
      ></Form.Item>
      <Form.Item label="Slice size">
        {getFieldDecorator("settings.bulk.slice_size", {
          initialValue: stepData?.settings?.bulk?.slice_size || 1,
          rules: [
            {
              required: true,
              message: "Please input slice size!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={1} />)}
      </Form.Item>
      <Form.Item label="Documents">
        {getFieldDecorator("settings.bulk.docs", {
          initialValue: stepData?.settings?.bulk?.docs || 5000,
          rules: [
            {
              required: true,
              message: "Please input documents!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={0} />)}
      </Form.Item>
      <Form.Item label="Batch Size">
        {getFieldDecorator("settings.bulk.store_size_in_mb", {
          initialValue: stepData?.settings?.bulk?.store_size_in_mb || 10,
          rules: [
            {
              required: true,
              message: "Please input document size!",
            },
          ],
        })(
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            formatter={(value) => `${value}MB`}
            parser={(value) => value.replace("MB", "")}
          />
        )}
      </Form.Item>
      <Form.Item label="Max Worker Size">
        {getFieldDecorator("settings.bulk.max_worker_size", {
          initialValue: stepData?.settings?.bulk?.max_worker_size || 10,
          rules: [
            {
              required: true,
              message: "Please input max worker size!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={1} max={30} />)}
      </Form.Item>
      <Form.Item label="Idle Timeout In Seconds">
        {getFieldDecorator("settings.bulk.idle_timeout_in_seconds", {
          initialValue: stepData?.settings?.bulk?.idle_timeout_in_seconds || 5,
          rules: [
            {
              required: true,
              message: "Please input idle timeout in seconds!",
            },
          ],
        })(<InputNumber style={{ width: "100%" }} min={1} max={60} />)}
      </Form.Item>
      <Form.Item label="Compress">
        {getFieldDecorator("settings.bulk.compress", {
          initialValue:
            stepData?.settings?.bulk?.compress === true ? true : false,
        })(<Switch />)}
      </Form.Item>
      <Form.Item label="Skip verifying scrolled documents count">
        {getFieldDecorator("settings.skip_scroll_count_check", {
          initialValue:
            stepData?.settings?.skip_scroll_count_check === true ? true : false,
        })(<Switch />)}
      </Form.Item>
      <Form.Item label="Skip verifying written documents count">
        {getFieldDecorator("settings.skip_bulk_count_check", {
          initialValue:
            stepData?.settings?.skip_bulk_count_check === true ? true : false,
        })(<Switch checked= {skipbulkcountcheck} disabled={skipExistDocs} onChange={(checked) => {
            if(!skipExistDocs) setSkipbulkcountcheck(checked);
            }}/>)}
      </Form.Item>
      <Form.Item label="Skip existing documents">
        {getFieldDecorator("settings.bulk.operation", {
          initialValue:
            stepData?.settings?.bulk?.operation === "create" ? true : false,
        })(<Switch checked= {skipExistDocs} onChange={(checked) => {
              setSkipExistDocs(checked);
              if(checked) {
                setSkipbulkcountcheck(checked);
                setBulkOperation("create")
              }else{
                setBulkOperation("index")
              }
          }}/>)}
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
