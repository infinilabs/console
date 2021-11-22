import {
  Form,
  Input,
  Switch,
  Icon,
  InputNumber,
  Divider,
  Descriptions,
} from "antd";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import { formatMessage } from "umi/locale";

@Form.create()
export class ExtraStep extends React.Component {
  state = {};
  render() {
    const {
      form: { getFieldDecorator },
      initialValue,
    } = this.props;
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
          <Descriptions.Item
            label={formatMessage({
              id: "cluster.manage.table.column.endpoint",
            })}
          >
            {initialValue?.host}
          </Descriptions.Item>
          <Descriptions.Item label="TLS">
            {initialValue?.isTLS ? (
              <Icon type="lock" style={{ color: "#52c41a" }} />
            ) : null}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "cluster.manage.table.column.version",
            })}
          >
            {initialValue?.version}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "cluster.regist.step.connect.label.auth",
            })}
          >
            {initialValue?.username ? <Icon type="user" /> : null}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "cluster.manage.table.column.health",
            })}
          >
            <HealthStatusCircle status={initialValue?.status} />
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "cluster.manage.table.column.node_count",
            })}
          >
            {initialValue?.number_of_nodes}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "cluster.regist.step.connect.label.data_nodes",
            })}
          >
            {initialValue?.number_of_data_nodes}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "cluster.regist.step.connect.label.shards",
            })}
          >
            {initialValue?.active_shards}
          </Descriptions.Item>
        </Descriptions>
        <Divider />
        <Form
          {...formItemLayout}
          style={{ marginTop: 15 }}
          form={this.props.formRef}
        >
          <Form.Item
            label={formatMessage({
              id: "cluster.manage.table.column.name",
            })}
          >
            {getFieldDecorator("name", {
              initialValue: initialValue?.cluster_name || "",
              rules: [
                {
                  required: true,
                  message: "Please input cluster name!",
                },
              ],
            })(<Input autoComplete="off" placeholder="cluster-name" />)}
          </Form.Item>
          {/* <Form.Item label="Elasticsearch 版本">
            {getFieldDecorator('version', {
              initialValue: initialValue?.version || '',
            })(<Input readOnly={true} />)}
          </Form.Item> */}
          {/* <Form.Item label="排序权重">
            {getFieldDecorator('order', {
              initialValue: 0,
            })(<InputNumber />)}
          </Form.Item> */}
          <Form.Item
            label={formatMessage({
              id: "cluster.manage.table.column.description",
            })}
          >
            {getFieldDecorator("description", {
              initialValue: "",
            })(<Input.TextArea placeholder="cluster description" />)}
          </Form.Item>
          {/* <Form.Item label="是否启用">
            {getFieldDecorator('enabled', {
              valuePropName: 'checked',
              initialValue: true,
            })(<Switch
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
            />)}
          </Form.Item> */}
          <Form.Item
            label={formatMessage({
              id: "cluster.manage.table.column.monitored",
            })}
          >
            {getFieldDecorator("monitored", {
              valuePropName: "checked",
              initialValue: true,
            })(
              <Switch
                checkedChildren={<Icon type="check" />}
                unCheckedChildren={<Icon type="close" />}
              />
            )}
          </Form.Item>
        </Form>
      </>
    );
  }
}
