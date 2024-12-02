import { Form, Input, Select, Switch } from "antd";

const EditParameter = Form.create({ name: "parameter_form" })(
  ({ form, formRef, initialValue = {} }) => {
    formRef.current = form;
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
    return (
      <div style={{ minWidth: 320 }}>
        <Form {...formItemLayout}>
          <Form.Item label={"Label"}>
            {getFieldDecorator("label", {
              initialValue: initialValue.label,
              rules: [
                {
                  required: true,
                  message: "Please input label!",
                },
              ],
            })(<Input autoComplete="off" placeholder="Parameter Label" />)}
          </Form.Item>
          <Form.Item label={"Type"}>
            {getFieldDecorator("type", {
              initialValue: initialValue.type || "string",
            })(
              <Select>
                <Select.Option value="string">String</Select.Option>
                <Select.Option value="number">Number</Select.Option>
                <Select.Option value="date">Date</Select.Option>
              </Select>
            )}
          </Form.Item>
          <Form.Item label="Is Constant">
            {getFieldDecorator("is_constant", {
              initialValue: initialValue.is_constant,
              valuePropName: "checked",
            })(<Switch />)}
          </Form.Item>
          <Form.Item label="Value">
            {getFieldDecorator("value", {
              initialValue: initialValue.value,
              rules: [
                {
                  required: true,
                  message: "Please input constant value!",
                },
              ],
            })(<Input placeholder="constant value" />)}
          </Form.Item>
        </Form>
      </div>
    );
  }
);
export default EditParameter;
