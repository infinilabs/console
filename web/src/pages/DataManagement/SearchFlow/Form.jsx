import React from "react";
import {
  Card,
  Form,
  Icon,
  Input,
  InputNumber,
  Button,
  Switch,
  message,
  Spin,
} from "antd";
import router from "umi/router";

import styles from "../../System/Cluster/Form.less";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { formatMessage } from "umi/locale";
import request from "@/utils/request";
import { ESPrefix } from "@/services/common";
import { useGlobal } from "@/layouts/GlobalContext";

export default Form.create({ name: "trace_template_form" })(
  ({ form, history, match }) => {
    const { selectedCluster } = useGlobal();
    const mode = React.useMemo(() => {
      const { template_id } = match.params;
      if (template_id) {
        return "EDIT";
      }
      return "NEW";
    }, [selectedCluster]);
    const [editValue, setEditValue] = React.useState({});
    React.useEffect(() => {
      const { template_id } = match.params;
      if (template_id) {
        const fetchData = async () => {
          const res = await request(
            `${ESPrefix}/${selectedCluster.id}/trace_template/${template_id}`,
            {}
          );
          if (!res || res.error) {
            return false;
          }
          setEditValue(res._source);
        };
        fetchData();
      }
    }, [selectedCluster]);

    const handleSubmit = React.useCallback(() => {
      form.validateFields(async (errors, values) => {
        if (errors) {
          return;
        }
        let res = null;
        if (mode == "NEW") {
          res = request(`${ESPrefix}/${selectedCluster.id}/trace_template`, {
            method: "POST",
            body: values,
          });
        } else {
          const { template_id } = match.params;

          res = request(
            `${ESPrefix}/${selectedCluster.id}/trace_template/${template_id}`,
            {
              method: "PUT",
              body: {
                ...editValue,
                ...values,
              },
            }
          );
        }

        if (!res || res.error) {
          return false;
        }
        if (mode == "NEW") form.resetFields();
        message.success("save succeed");
      });
    }, [selectedCluster, mode, editValue]);

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
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
          offset: 6,
        },
      },
    };
    if (!selectedCluster.id) {
      return null;
    }
    return (
      <PageHeaderWrapper>
        <Card
          title={mode == "NEW" ? "新建搜索流" : "编辑搜索流"}
          extra={[
            <Button
              type="primary"
              onClick={() => {
                history.go(-1);
              }}
            >
              {formatMessage({
                id: "form.button.goback",
              })}
            </Button>,
          ]}
        >
          <Spin spinning={false}>
            <Form {...formItemLayout}>
              <Form.Item label={"Template Name"}>
                {getFieldDecorator("name", {
                  initialValue: editValue.name,
                  rules: [
                    {
                      required: true,
                      message: "Please input template name!",
                    },
                  ],
                })(<Input autoComplete="off" placeholder="template-name" />)}
              </Form.Item>
              <Form.Item label={"Meta Index"}>
                {getFieldDecorator("meta_index", {
                  initialValue: editValue.meta_index,
                  rules: [
                    {
                      required: true,
                      message: "Please input meta index!",
                    },
                  ],
                })(<Input placeholder="meta index" />)}
              </Form.Item>
              <Form.Item label="Trace Field">
                {getFieldDecorator("trace_field", {
                  initialValue: editValue.trace_field,
                  rules: [
                    {
                      required: true,
                      message: "Please input trace field!",
                    },
                  ],
                })(<Input placeholder="trace field" />)}
              </Form.Item>

              <Form.Item label={"Timestamp Field"}>
                {getFieldDecorator("timestamp_field", {
                  initialValue: editValue.timestamp_field,
                  rules: [
                    {
                      required: true,
                      message: "Please input timestamp field!",
                    },
                  ],
                })(<Input autoComplete="off" placeholder="timestamp field" />)}
              </Form.Item>
              <Form.Item label={"Agg Field"} hasFeedback>
                {getFieldDecorator("agg_field", {
                  initialValue: editValue.agg_field,
                  rules: [
                    {
                      required: true,
                      message: "Please input aggregation field!",
                    },
                  ],
                })(<Input placeholder="agg field" />)}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.table.column.description",
                })}
              >
                {getFieldDecorator("description", {
                  initialValue: editValue.description,
                })(<Input.TextArea placeholder="Cluster Descirption" />)}
              </Form.Item>
              <Form.Item {...tailFormItemLayout}>
                <Button type="primary" onClick={handleSubmit}>
                  {formatMessage({
                    id: "form.button.save",
                  })}
                </Button>
              </Form.Item>
            </Form>
          </Spin>
        </Card>
      </PageHeaderWrapper>
    );
  }
);
