import {
  Form,
  Input,
  Switch,
  Icon,
  InputNumber,
  Divider,
  Descriptions,
  Select,
} from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { useMemo } from "react";
import TagEditor from "@/components/infini/TagEditor";

export const ExtraStep = Form.create({ name: "instance_step_edit" })(
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

    return (
      <>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Endpoint">
            {initialValue?.endpoint}
          </Descriptions.Item>
          <Descriptions.Item label="Version">
            {initialValue?.version.number}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {initialValue?.status}
          </Descriptions.Item>
        </Descriptions>
        <Divider />
        <Form
          {...formItemLayout}
          style={{ marginTop: 15 }}
          form={props.formRef}
        >
          <Form.Item
            label={formatMessage({
              id: "gateway.instance.field.name.label",
            })}
          >
            {getFieldDecorator("name", {
              initialValue: initialValue?.name || "",
              rules: [
                {
                  required: true,
                  message: formatMessage({
                    id: "gateway.instance.field.name.form.required",
                  }),
                },
              ],
            })(<Input autoComplete="off" />)}
          </Form.Item>
          <Form.Item
            label={formatMessage({
              id: "gateway.instance.field.tags.label",
            })}
          >
            {getFieldDecorator("tags", {
              initialValue: initialValue?.tags,
              rules: [],
            })(<TagEditor />)}
          </Form.Item>
          <Form.Item
            label={formatMessage({
              id: "cluster.manage.table.column.description",
            })}
          >
            {getFieldDecorator("description", {
              initialValue: "",
            })(
              <Input.TextArea
                placeholder={formatMessage({
                  id: "gateway.instance.field.description.placeholder",
                })}
              />
            )}
          </Form.Item>
        </Form>
      </>
    );
  }
);
