import { Form, Input, Select } from "antd";
import { formatMessage } from "umi/locale";

export default Form.create({ name: "dependcydsl_form" })(
  ({ form, formRef, initialValue = {} }) => {
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
      <div style={{ paddingTop: 20 }} className="dependcy-step">
        <div className="col">
          <Form {...formItemLayout}>
            <Form.Item label={"Cluster"}>
              {getFieldDecorator("cluster_id", {
                initialValue: "",
                rules: [
                  {
                    required: true,
                    message: "Please input name!",
                  },
                ],
              })(<Input autoComplete="off" placeholder="cluster name" />)}
            </Form.Item>
            <Form.Item label={"Index Name"}>
              {getFieldDecorator("index", {
                initialValue: "",
                rules: [
                  {
                    required: true,
                    message: "Please input index name!",
                  },
                ],
              })(<Input placeholder="index name" />)}
            </Form.Item>
            <Form.Item label="Query DSL">
              {getFieldDecorator("query_dsl", {
                initialValue: "",
              })(
                <Input.TextArea
                  placeholder="Query DSL"
                  style={{ height: 200 }}
                />
              )}
            </Form.Item>
          </Form>
        </div>
        <div className="col"></div>
      </div>
    );
  }
);
