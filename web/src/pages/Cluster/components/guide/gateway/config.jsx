import { Form, Input, Switch, Icon, InputNumber, Select } from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { useMemo } from "react";
import { formatESSearchResult } from "@/lib/elasticsearch/util";

const { Option } = Select;

export const ConfigStep = Form.create({ name: "gateway_guide_config" })(
  (props) => {
    const {
      form: { getFieldDecorator },
      initialValue,
    } = props;
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
    const { loading, error, value } = useFetch(
      `/instance/_search`,
      {
        queryParams: {
          size: 10000,
        },
      },
      []
    );
    const { data: instances, total } = React.useMemo(() => {
      if (!value) {
        return {
          data: [],
          total: 0,
        };
      }
      return formatESSearchResult(value);
    }, [value]);

    return (
      <>
        <Form
          {...formItemLayout}
          style={{ marginTop: 15 }}
          form={props.formRef}
        >
          <Form.Item
            label={formatMessage({
              id: "gateway.guide.config.label.cluster_name",
            })}
          >
            {getFieldDecorator("cluster_name", {
              initialValue: initialValue?.cluster_name || "",
            })(<div>{initialValue?.cluster_name}</div>)}
          </Form.Item>
          <Form.Item
            label={formatMessage({ id: "gateway.guide.config.label.name" })}
          >
            {getFieldDecorator("name", {
              initialValue: initialValue?.name || "",
              rules: [
                {
                  required: true,
                  message: "Please input name!",
                },
              ],
            })(<Input autoComplete="off" />)}
          </Form.Item>
          <Form.Item
            label={formatMessage({ id: "gateway.guide.config.label.instance" })}
          >
            {getFieldDecorator("gateway", {
              initialValue: initialValue?.gateway || "",
              rules: [
                {
                  required: true,
                  message: "Please select gateway instance!",
                },
              ],
            })(
              <Select
                showSearch
                filterOption={(input, option) =>
                  option.props.children
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                dropdownStyle={{zIndex:10002}}
              >
                {instances.map((r) => {
                  return (
                    <Option key={r.id} value={r.id}>
                      {r.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </Form.Item>
        </Form>
      </>
    );
  }
);
