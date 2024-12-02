import { Form, Input } from "antd";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "search_flow_form" })(
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
      <div style={{ paddingTop: 20 }}>
        <Form {...formItemLayout}>
          <Form.Item label={"Flow Name"}>
            {getFieldDecorator("name", {
              initialValue: initialValue.name,
              rules: [
                {
                  required: true,
                  message: "Please input name!",
                },
              ],
            })(<Input autoComplete="off" placeholder="search flow name" />)}
          </Form.Item>
          <Form.Item label={"Index Name"}>
            {getFieldDecorator("index", {
              initialValue: initialValue.index,
              rules: [
                {
                  required: true,
                  message: "Please input index name!",
                },
              ],
            })(<Input placeholder="index name" />)}
          </Form.Item>
          <Form.Item
            label={formatMessage({
              id: "cluster.manage.table.column.description",
            })}
          >
            {getFieldDecorator("description", {
              initialValue: initialValue.description,
            })(<Input.TextArea placeholder="Descirption" />)}
          </Form.Item>
        </Form>
      </div>
    );
  }
);
