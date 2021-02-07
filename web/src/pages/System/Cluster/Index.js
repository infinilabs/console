import  React from 'react';
import {Button, Card, Col, Divider, Form, Input, Row, Table,Switch, Icon} from "antd";
import Link from "_umi@2.13.16@umi/link";

@Form.create()
class Index extends  React.Component {
  columns = [{
    title: '集群名称',
    dataIndex: 'name',
    key: 'name',
  },{
    title: '集群访问URL',
    dataIndex: 'endpoint',
    key: 'endpoint',
  },{
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  },{
    title: '密码',
    dataIndex: 'password',
    key: 'password',
  },{
    title: '排序权重',
    dataIndex: 'order',
    key: 'order',
  },{
    title: '描述',
    dataIndex: 'description',
    key: 'description',
  },{
    title: '是否启用',
    dataIndex: 'enabled',
    key: 'enabled',
  }]

  render() {
    const {getFieldDecorator} = this.props.form;
    const formItemLayout = {
      labelCol: { span: 10 },
      wrapperCol: { span: 14 },
      style: {marginBottom: 0}
    };
    return (
      <Card>
        <Form>
          <Row gutter={{md:16, sm:8}}>
            <Col md={8} sm={10}>
              <Form.Item {...formItemLayout} label="集群名称">
                {getFieldDecorator('name')(<Input placeholder="please input cluster name" />)}
              </Form.Item>
            </Col>
            <Col md={8} sm={8}>
              <div style={{paddingTop:4}}>
                <Button type="primary" icon="search" onClick={this.handleSearch}>
                  Search
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
        <Divider style={{marginBottom:0}} />
        <Card
          bodyStyle={{padding:0}}
          extra={<div>
            <span style={{marginRight:24}}><Switch
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
              defaultChecked
            />是否启用</span>
           <Link to='/system/cluster/new'> <Button type="primary" icon="plus">New</Button></Link>
          </div>}
          bordered={false}>
          <Table
            bordered
            columns={this.columns}
            dataSource={[]}
            rowKey='id'
          />
        </Card>
      </Card>
    );
  }

}

export default  Index;