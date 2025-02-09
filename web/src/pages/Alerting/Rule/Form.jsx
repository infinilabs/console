import {
  Form,
  Input,
  Switch,
  Select,
  InputNumber,
  Card,
  Popover,
  Button,
  Row,
  Col,
  Icon,
  Divider,
  Tabs,
  TimePicker,
  message,
} from "antd";
import { connect } from "dva";
import { FunctionOutlined, SendOutlined } from "@ant-design/icons";
import DropdownSelect from "@/components/GlobalHeader/DropdownSelect";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import request from "@/utils/request";
import { useHistory } from "react-router-dom";
import { ESPrefix } from "@/services/common";
import { formatMessage } from "umi/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import clusterBg from "@/assets/cluster_bg.png";
import "@/assets/headercontent.scss";
import "./form.scss";
import useFetch from "@/lib/hooks/use_fetch";
import FormAlertObject from "./FormAlertObject";
import FormAlertChannel from "./FormAlertChannel";
import { isJSONString } from "@/utils/utils";
import { Editor } from "@/components/monaco-editor";
import FormAlertRecoveryChannel from "./FormAlertRecoveryChannel";
import { cloneDeep } from "lodash";
import CustomSelect from "@/components/infini/CustomSelect";
import _ from "lodash";
import ClusterSelect from "@/components/ClusterSelect";

const { Option } = Select;
const { TextArea } = Input;
const InputGroup = Input.Group;
const { TabPane } = Tabs;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 20 },
  },
};
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 4,
    },
  },
};

const RuleForm = (props) => {
  const { submitLoading } = props;
  const editValue = props.value || {};
  const { getFieldDecorator } = props.form;
  const history = useHistory();
  const [recoveryEnabled, setRecoveryEnabled] = useState(
    editValue?.recovery_notification_config?.event_enabled || false
  );

  const [objectFields, setObjectFields] = useState({});
  const [objectFieldsQueryParams, setObjectFieldsQueryParams] = useState({
    pattern: "",
    size: 10,
    keyword: "",
  });

  const onSearchObjectFields = (obj) => {
    if (obj.keyword && obj.keyword.length <= 2) {
      return;
    }
    if (objectFieldsQueryParams.hasOwnProperty("es_type")) {
      delete objectFieldsQueryParams.es_type;
    }
    if (objectFieldsQueryParams.hasOwnProperty("aggregatable")) {
      delete objectFieldsQueryParams.aggregatable;
    }
    setObjectFieldsQueryParams({ ...objectFieldsQueryParams, ...obj });
  };

  const [resourceObjects, setResourceObjects] = useState([]);
  const fetchResourceObjects = async () => {
    if (!selectedCluster?.id) {
      setResourceObjects([]);
      return;
    }
    const res = await request(
      `${ESPrefix}/${selectedCluster?.id}/indices/realtime`,
      {
        method: "GET",
      }
    );
    if (res && res?.length > 0) {
      setResourceObjects(res);
    } else {
      setResourceObjects([]);
    }
  };

  const fetchObjectFields = async (obj = {}) => {
    if (!selectedCluster.id || selectedObjects.length == 0) {
      setObjectFields({});
      return;
    }
    let queryParams = {
      ...objectFieldsQueryParams,
      ...obj,
      pattern: selectedObjects.join(","),
    };
    const res = await request(
      `${ESPrefix}/${selectedCluster?.id}/view/_fields_for_wildcard`,
      {
        method: "GET",
        queryParams: queryParams,
      }
    );
    if (res?.fields) {
      let selectFields = [];
      res.fields.map((item) => {
        selectFields.push({
          name: item.name,
          label: item.name,
          type: item.type,
        });
      });
      objectFields[queryParams.state_key] = selectFields;
      setObjectFields({ ...objectFields });
    }
  };

  const formatChannelItems = (items) => {
    return items?.map((item) => {
      const { id, type, enabled, isAdvanced } = item;
      if (isAdvanced) {
        const channelItem = item[type];
        if (channelItem && channelItem.header_params_cache) {
          const header_params_obj = {};
          channelItem.header_params_cache.map((hp) => {
            if (hp.key.length && hp.value.length) {
              header_params_obj[hp.key] = hp.value;
            }
          });
          channelItem.header_params = header_params_obj;
          const { header_params_cache, ...restProps } = channelItem;
          item[type] = restProps;
        }
        if (id?.startsWith("_tmp_")) {
          delete item.id;
        }
        return {
          ...item,
          [type]: item[type],
        };
      } else {
        return { id, enabled };
      }
    });
  };

  const formatAlertObjects = (values) => {
    if (!editValue?.id) {
      values.enabled = true;
    } else {
      values.id = editValue.id;
    }

    values.schedule = {
      interval: "1m",
    };
    values.resource.type = editValue?.resource?.type || "elasticsearch";
    values.resource.filter = editValue?.resource?.filter || {};
    values.resource.context = { fields: null };

    values.resource.resource_id = selectedCluster.id;
    values.resource.resource_name = selectedCluster.name;

    let raw_filter = values.resource.raw_filter;
    if (raw_filter) {
      try {
        raw_filter = JSON.parse(raw_filter);
      } catch (e) {
        console.log("raw_filter json parse failed,", e);
        message.warn("raw_filter json parse failed");
        return;
      }
    } else {
      raw_filter = {};
    }
    values.resource.raw_filter = raw_filter;
    if (values?.notification_config?.enabled) {
      values.notification_config.accept_time_range.start = values.notification_config.accept_time_range.start.format(
        "HH:mm"
      );
      values.notification_config.accept_time_range.end = values.notification_config.accept_time_range.end.format(
        "HH:mm"
      );
      values.notification_config.normal = formatChannelItems(
        values.notification_config.normal
      );
      if (values.notification_config.escalation_enabled) {
        values.notification_config.escalation = formatChannelItems(
          values.notification_config.escalation
        );
      }
    }

    if (values?.recovery_notification_config?.enabled) {
      values.recovery_notification_config.normal = formatChannelItems(
        values.recovery_notification_config.normal
      );
    }

    let alert_objects = values.alert_objects;
    delete values.alert_objects;

    alert_objects = alert_objects.map((alert_object) => {
      if (alert_object.conditions) {
        alert_object.conditions["operator"] = "any";
        alert_object.conditions.items = alert_object.conditions.items.map(
          (item) => {
            return {
              ...item,
              minimum_period_match: parseInt(item.minimum_period_match),
            };
          }
        );
      }
      return { ...values, ...alert_object };
    });
    return alert_objects;
  };
  // console.log("editValue:", editValue);
  const [previewMetricData, setPreviewMetricData] = useState(
    editValue?.alert_objects
      ? [
          {
            ...editValue,
            name: editValue.alert_objects[0].name,
            metrics: editValue.alert_objects[0].metrics,
            conditions: editValue.alert_objects[0].conditions,
          },
        ]
      : []
  );

  const onPreviewChartChange = useCallback(() => {
    // _.delay(() => {
    //   const values = props.form.getFieldsValue();
    //   let alert_objects = formatAlertObjects(values);
    //   console.log("onPreviewChartChange alert_objects:", alert_objects);
    //   setPreviewMetricData(alert_objects);
    // }, 200);
  }, [props.form]);

  const handleSubmit = useCallback(
    (parmas) => {
      props.form.validateFields((err, values) => {
        if (err) {
          if (parmas.is_test) {
            message.error("please check rule config!");
          }
          return false;
        }

        let newValues = cloneDeep(values);

        switch (parmas?.category) {
          case "notification":
            newValues.notification_config[
              "normal"
            ] = newValues.notification_config["normal"]
              .filter((item, i) => i == parmas.channel_index)
              .map((item) => ({
                ...item,
                ...(parmas?.channel || {}),
                enabled: true,
              }));
            newValues.notification_config["escalation"] = [];
            newValues.recovery_notification_config["normal"] = [];
            break;
          case "escalation":
            newValues.notification_config[
              "escalation"
            ] = newValues.notification_config["escalation"]
              .filter((item, i) => i == parmas.channel_index)
              .map((item) => ({
                ...item,
                ...(parmas?.channel || {}),
                enabled: true,
              }));
            newValues.notification_config["normal"] = [];
            newValues.recovery_notification_config["normal"] = [];
            break;
          case "recover_notification":
            newValues.recovery_notification_config[
              "normal"
            ] = newValues.recovery_notification_config["normal"]
              .filter((item, i) => i == parmas.channel_index)
              .map((item) => ({
                ...item,
                ...(parmas?.channel || {}),
                enabled: true,
              }));
            newValues.notification_config["normal"] = [];
            newValues.notification_config["escalation"] = [];
            break;
        }

        const alert_objects = formatAlertObjects(newValues);

        if (parmas?.is_test) {
          onSendTestClick(alert_objects[0], parmas?.category);
          return;
        }

        if (typeof props.onSaveClick == "function") {
          props.onSaveClick(alert_objects);
        }
      });
    },
    [props.form]
  );

  const [testState, setTestState] = useState({ loading: false, result: "" });
  const onSendTestClick = useCallback(async (values, type) => {
    if (!type) return;
    setTestState({ loading: true, result: "" });
    const res = await request(`/alerting/rule/test?type=${type}`, {
      method: "POST",
      body: values,
    });
    if (res && res.action_results && !res.action_results?.[0]?.error) {
      message.success(
        formatMessage({
          id: "app.message.operate.success",
        })
      );
      setTestState({
        loading: false,
        result: res.action_results?.[0]?.result,
      });
    } else {
      message.error(
        formatMessage({
          id: "app.message.operate.failed",
        })
      );
      setTestState({
        loading: false,
        result:
          res?.action_results?.[0]?.error ||
          res?.action_results?.[0]?.result ||
          "error",
      });
    }
  }, []);

  const [statPeriod, setStatPeriod] = useState(
    editValue?.alert_objects?.[0]?.metrics?.bucket_size || "1m"
  );

  const [selectedObjects, setSelectedObjects] = useState(
    editValue?.resource?.objects || []
  );
  const selectedClusterDefault = editValue.id
    ? {
        id: editValue.resource.resource_id,
        name: editValue.resource.resource_name,
      }
    : props.selectedCluster;
  const [selectedCluster, setSelectedCluster] = useState(
    selectedClusterDefault
  );
  if (!editValue.id) {
    useMemo(() => {
      setSelectedCluster(props.selectedCluster);
    }, [props.selectedCluster]);
  }

  React.useEffect(() => {
    fetchResourceObjects();
  }, [selectedCluster?.id]);
  React.useEffect(() => {
    fetchObjectFields();
  }, [objectFieldsQueryParams]);
  React.useEffect(() => {
    fetchObjectFields({
      es_type: "date",
      state_key: "metric_date_field",
    });
    fetchObjectFields({
      aggregatable: true,
      es_type: "keyword",
      state_key: "metric_keyword_field",
    });
  }, [selectedObjects]);

  const [valuesState, setValuesState] = useState({});
  const { value: cateItems } = useFetch(
    `/alerting/rule/_search_values`,
    {
      queryParams: {
        field: "category",
        keyword: valuesState.categoryKeyword,
      },
    },
    [valuesState.categoryKeyword]
  );
  const onSearchCategory = _.debounce((value) => {
    setValuesState((st) => {
      return {
        ...st,
        categoryKeyword: value,
      };
    });
  }, 500);

  const { value: tagItems } = useFetch(
    `/alerting/rule/_search_values`,
    {
      queryParams: {
        field: "tags",
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
    <PageHeaderWrapper>
      <Card
        bordered={false}
        title={props.title || ""}
        extra={
          <Button
            type="primary"
            onClick={() => {
              history.goBack();
            }}
          >
            {formatMessage({ id: "form.button.goback" })}
          </Button>
        }
      >
        <Form {...formItemLayout} className="formCompact">
          <Form.Item
            label={formatMessage({
              id: "alert.rule.form.label.select_cluster",
            })}
          >
            {props.clusterList.length > 0 ? (
              <ClusterSelect 
                width={300}
                dropdownWidth={400}
                selectedCluster={selectedCluster} 
                onChange={(item) => {
                  setSelectedCluster(item);
                }}
              />  
            ) : (
              "No cluster available"
            )}
          </Form.Item>

          <Form.Item
            label={formatMessage({
              id: "alert.rule.form.label.select_object",
            })}
          >
            {getFieldDecorator("resource.objects", {
              initialValue: editValue?.resource?.objects || [],
              rules: [
                {
                  required: true,
                  message: "Please select objects!",
                },
              ],
            })(
              <Select
                allowClear
                showSearch
                mode="tags"
                placeholder="Type to search objects"
                onChange={(value) => {
                  setSelectedObjects(value);
                }}
              >
                {resourceObjects.map((item, i) => {
                  return (
                    <Option key={i} value={item.index}>
                      {item.index}
                    </Option>
                  );
                })}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            label={formatMessage({
              id: "alert.rule.form.label.filter_condition",
            })}
            extra={
              <Popover
                title={"Example"}
                content={
                  <Editor
                    height="300px"
                    width="600px"
                    language="json"
                    theme="light"
                    value={JSON.stringify(
                      JSON.parse(
                        `{"bool":{"must":[{"match":{"payload.elasticsearch.cluster_health.status":"red"}},{"term":{"metadata.name":{"value":"cluster_health"}}}]}}`
                      ),
                      null,
                      2
                    )}
                    options={{
                      minimap: {
                        enabled: false,
                      },
                      wordBasedSuggestions: true,
                    }}
                  />
                }
                trigger="click"
              >
                <a>Example</a>
              </Popover>
            }
          >
            {getFieldDecorator("resource.raw_filter", {
              initialValue:
                typeof editValue?.resource?.raw_filter == "object"
                  ? JSON.stringify(editValue?.resource?.raw_filter)
                  : editValue?.resource?.raw_filter,
              rules: [
                {
                  required: false,
                },
                {
                  validator: (rule, value, callback) => {
                    if (value && !isJSONString(value)) {
                      callback("Incorrect JSON format!");
                    } else {
                      callback();
                    }
                  },
                },
              ],
            })(
              <TextArea
                rows={8}
                placeholder={`{
                  "bool": {
                      "must": [
                          {
                              "match": {
                                  "payload.elasticsearch.cluster_health.status": "yellow"
                              }
                          },
                          {
                              "term": {
                                  "metadata.name": {
                                      "value": "cluster_health"
                                  }
                              }
                          }
                      ]
                  }
              }`}
              />
            )}
          </Form.Item>
          <Row gutter={24}>
            <Col span={11} offset={2} style={{ paddingLeft: 22 }}>
              <Form.Item
                label={formatMessage({
                  id: "alert.rule.form.label.time_field",
                })}
              >
                {getFieldDecorator("resource.time_field", {
                  initialValue: editValue?.resource?.time_field,
                  rules: [
                    {
                      required: true,
                      message: "Please select time field!",
                    },
                  ],
                })(
                  <Select
                    allowClear
                    showSearch
                    placeholder="Type to search time field"
                    onSearch={(value) =>
                      onSearchObjectFields({
                        keyword: value,
                        es_type: "date",
                        state_key: "time_field",
                      })
                    }
                  >
                    {(
                      objectFields?.time_field ||
                      objectFields?.metric_date_field
                    )?.map((item, i) => {
                      return (
                        <Option key={i} value={item.name}>
                          {item.label}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </Form.Item>
            </Col>
            {editValue.id ? null : (
              <Col span={11}>
                <Form.Item
                  label={formatMessage({
                    id: "alert.rule.form.label.stat_period",
                  })}
                  labelCol={{ xs: { span: 24 }, sm: { span: 5 } }}
                  wrapperCol={{ xs: { span: 24 }, sm: { span: 19 } }}
                >
                  {getFieldDecorator(`bucket_size`, {
                    initialValue: statPeriod,
                    rules: [
                      {
                        required: true,
                        message: "Please select period!",
                      },
                    ],
                  })(
                    <Select
                      placeholder="Please select period"
                      onChange={(value) => {
                        setStatPeriod(value);
                      }}
                    >
                      <Option value="10s">10 seconds</Option>
                      <Option value="30s">30 seconds</Option>
                      <Option value="1m">1 minutes</Option>
                      <Option value="5m">5 minutes</Option>
                      <Option value="10m">10 minutes</Option>
                      <Option value="30m">30 minutes</Option>
                      <Option value="1h">1 hours</Option>
                      <Option value="24h">1 days</Option>
                      <Option value="168h">1 weeks</Option>
                      <Option value="720h">1 months</Option>
                    </Select>
                  )}
                </Form.Item>
              </Col>
            )}
          </Row>
          <Row gutter={24}>
            <Col span={11} offset={2} style={{ paddingLeft: 22 }}>
              <Form.Item
                label={formatMessage({
                  id: "alert.rule.form.label.category",
                })}
              >
                {getFieldDecorator("category", {
                  initialValue: editValue?.category,
                  rules: [
                    {
                      required: true,
                      message: "Please input or select a category!",
                    },
                  ],
                })(
                  <CustomSelect
                    allowClear
                    showSearch
                    onSearch={onSearchCategory}
                    placeholder="Input or select category"
                  >
                    {(_.isArray(cateItems) ? cateItems : []).map((item) => {
                      return (
                        <Select.Option key={item} value={item}>
                          {item}
                        </Select.Option>
                      );
                    })}
                  </CustomSelect>
                )}
              </Form.Item>
            </Col>
            <Col span={11}>
              <Form.Item
                label={formatMessage({
                  id: "alert.rule.form.label.tags",
                })}
                labelCol={{ xs: { span: 24 }, sm: { span: 5 } }}
                wrapperCol={{ xs: { span: 24 }, sm: { span: 19 } }}
              >
                {getFieldDecorator(`tags`, {
                  initialValue: editValue?.tags,
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
            </Col>
          </Row>

          <Divider orientation="left">
            {formatMessage({
              id: "alert.rule.form.title.configure_alert_object",
            })}
          </Divider>
          <FormAlertObject
            form={props.form}
            objectFields={objectFields}
            onSearchObjectFields={onSearchObjectFields}
            alertObjects={editValue?.alert_objects}
            isEditMode={editValue?.id ? true : false}
            onPreviewChartChange={onPreviewChartChange}
            previewMetricData={previewMetricData}
            statPeriod={statPeriod}
          />

          <Divider orientation="left">
            {formatMessage({
              id: "alert.rule.form.title.configure_alert_channel",
            })}{" "}
          </Divider>

          <FormAlertChannel
            form={props.form}
            notificationConfig={editValue?.notification_config}
            handleTest={handleSubmit}
            testState={testState}
          />

          <Divider orientation="left">
            {formatMessage({
              id: "alert.rule.form.title.configure_alert_channel_recovery",
            })}{" "}
            {getFieldDecorator("recovery_notification_config[event_enabled]", {
              valuePropName: "checked",
              initialValue: recoveryEnabled,
              rules: [],
            })(
              <Switch
                onChange={(checked) => {
                  setRecoveryEnabled(checked);
                }}
              />
            )}
          </Divider>

          {recoveryEnabled && (
            <FormAlertRecoveryChannel
              form={props.form}
              value={editValue?.recovery_notification_config}
              handleTest={handleSubmit}
              testState={testState}
            />
          )}

          <Form.Item {...tailFormItemLayout}>
            <Button
              loading={submitLoading}
              type="primary"
              onClick={handleSubmit}
            >
              {formatMessage({ id: "form.button.save" })}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageHeaderWrapper>
  );
};
export default connect(({ global }) => ({
  selectedCluster: global.selectedCluster,
  clusterList: global.clusterList,
  clusterStatus: global.clusterStatus,
}))(RuleForm);
