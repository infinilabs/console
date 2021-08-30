import {Form, Input, Switch, Icon, InputNumber, Divider, Descriptions} from 'antd';
import {HealthStatusCircle} from '../health_status';

@Form.create()
export class ExtraStep extends React.Component {
  state = {
  }
  render(){
    const {form:{getFieldDecorator}, initialValue} = this.props;
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
          <Descriptions.Item label="集群地址" >
              {initialValue?.host}
          </Descriptions.Item>
          <Descriptions.Item label="TLS" >
            {initialValue?.isTLS ? <Icon type="lock" style={{color:  '#52c41a'}}/> : null}
          </Descriptions.Item>
          <Descriptions.Item label="集群版本" >
              {initialValue?.version}
          </Descriptions.Item>
          <Descriptions.Item label="身份验证" >
            {initialValue?.username ? <Icon type="user"/>: null}
          </Descriptions.Item>
          <Descriptions.Item label="健康状态" >
            <HealthStatusCircle status={initialValue?.status}/>
          </Descriptions.Item>
          <Descriptions.Item label="节点总数" >
            {initialValue?.number_of_nodes}
          </Descriptions.Item>     
          <Descriptions.Item label="数据节点数" >
            {initialValue?.number_of_data_nodes}
          </Descriptions.Item>
          <Descriptions.Item label="分片总数" >
            {initialValue?.active_shards}
          </Descriptions.Item>
        </Descriptions>
        <Divider/>
        <Form {...formItemLayout} style={{marginTop:15}} form={this.props.formRef}>
          <Form.Item label="集群名称" >
            {getFieldDecorator('name', {
              initialValue: initialValue?.cluster_name || '',
              rules: [
                {
                  required: true,
                  message: 'Please input cluster name!',
                },
              ],
            })(<Input autoComplete='off' placeholder="cluster-name" />)}
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
          <Form.Item label="描述">
            {getFieldDecorator('description', {
              initialValue: '',
            })(<Input.TextArea placeholder="集群应用描述" />)}
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
          <Form.Item label="启用监控">
            {getFieldDecorator('monitored', {
              valuePropName: 'checked',
              initialValue: true,
            })(<Switch
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
            />)}
          </Form.Item>
        </Form>
      </>
      )
    }
}
