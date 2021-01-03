import { Card, Table, Form, Row, Input, Col, Button, Divider } from 'antd';
import React from 'react';
import {connect} from 'dva'

@connect(({rebuildlist}) => ({
  rebuildlist,
}))
@Form.create()
class RebuildList extends React.Component {
  componentDidMount(){
    const {dispatch} = this.props;
    dispatch({
      type: 'rebuildlist/fetchRebuildList',
      payload:{
        index: 'infinireindex'
      }
    })
  }
  columns = [{
    title: 'rebuild name',
    dataIndex: 'name',
    key: 'name',
  },{
    title: 'description',
    dataIndex: 'desc',
    key: 'desc',
  },{
    title: 'status',
    dataIndex: 'status',
    key: 'status',
  },{
    title: 'took_time',
    dataIndex: 'took_time',
    key: 'took_time',
  },{
    title: 'created_at',
    dataIndex: 'created_at',
    key: 'created_at',
  },{
    title: 'Operation',
    render: (text, record) => (
      <div>
         <a onClick={() => {
          this.state.selectedRows.push(record);
          this.handleDeleteClick();
        }}>删除</a>
        {record.status=='FAILED' ? [<Divider type="vertical" />,<a onClick={() => {}}>Redo</a>,
        ]: ''}
       
      </div>
    ),
  },];
  render(){
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
              <Form.Item {...formItemLayout} label="Rebuild Name">
                {getFieldDecorator('name')(<Input placeholder="please input rebuild name" />)}
              </Form.Item>
            </Col>
            <Col md={8} sm={8}>
              <div style={{paddingTop:4}}>
                <Button type="primary" onClick={this.handleSearch}>
                  Search
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
        <Divider />
        <Table columns={this.columns} dataSource={this.props.rebuildlist.data}>

        </Table>
      </Card>
    )
  }
}

export default RebuildList;