import { Form, Input, Select } from "antd";
import { formatMessage } from "umi/locale";
import DropdownSelect from "@/components/GlobalHeader/DropdownSelect";
import { useGlobal } from "@/layouts/GlobalContext";

export default Form.create({ name: "dependcydsl_form" })(
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

    const { selectedCluster, clusterStatus, clusterList } = useGlobal();

    return (
      <div style={{ minWidth: 380 }} className="dependcy-step">
        <div className="col">
          <Form {...formItemLayout}>
            <Form.Item label={"Cluster"}>
              {getFieldDecorator("cluster_id", {
                initialValue: selectedCluster,
                rules: [
                  {
                    required: true,
                    message: "Please select cluster!",
                  },
                ],
              })(
                <DropdownSelect
                  visible={true}
                  clusterStatus={clusterStatus}
                  labelField="name"
                  size={56}
                  data={clusterList}
                />
              )}
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
