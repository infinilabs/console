import { Card, Table, Form, Row, Input, Col, Button, Divider, Tooltip,Popconfirm } from 'antd';
import Link from 'umi/link';
import React from 'react';
import {connect} from 'dva'

@connect(({rebuildlist}) => ({
  rebuildlist,
}))
@Form.create()
class RebuildList extends React.Component {
  componentDidMount(){
    this.fetchData({
      pageSize: 10,
      pageIndex: 1,
    })
  }
  fetchData = (params)=>{
    const {dispatch} = this.props;
    dispatch({
      type: 'rebuildlist/fetchRebuildList',
      payload: params,
    })
  }
  columns = [{
    title: 'id',
    dataIndex: 'id',
    key: 'id',
  },{
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
    render: (text, record) => (
      <span style={{color: text== 'SUCCESS' ? 'green': (text=='FAILED' ? 'red': 'blue')}}>
        {text == 'FAILED'? <Tooltip placeholder="top" title={record.error}>{text}</Tooltip> : text}
      </span>
    ),
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
         <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDeleteClick(record)}><a key="delete">Delete</a>
        </Popconfirm> 
        {record.status=='FAILED' ? <span><Divider type="vertical" /><a key="redo" onClick={()=>this.handleRedoClick(record)}>Redo</a></span>
        : ''}
       
      </div>
    ),
  },];

  handleDeleteClick =(record)=>{
    const {dispatch} = this.props;
    dispatch({
      type: 'rebuildlist/deleteTask',
      payload: [record.id],
    })
  }

  handleRedoClick = (record)=>{
    const {dispatch} = this.props;
    dispatch({
      type: 'rebuildlist/redoTask',
      payload: record,
    })
  }

  handleTableChange = (pagination, filters, sorter) =>{
    //console.log(pagination, filters, sorter);
    const {rebuildlist} = this.props;
    this.fetchData({
      pageIndex: pagination.current,
      pageSize: pagination.pageSize,
      name: rebuildlist.name,
      // sort: (sorter.order && sorter.field) || '',
      // sort_direction: sorter.order == 'ascend' ? 'asc' : 'desc'
    })
  }

  handleSearch = ()=>{
    const {form} = this.props;
    let nameVal = form.getFieldValue('name');
    this.fetchData({
      pageIndex: 1,
      pageSize: 10,
      name: nameVal,
    })
  }
  
  render(){
    const {getFieldDecorator} = this.props.form;
    const formItemLayout = {
      labelCol: { span: 10 },
      wrapperCol: { span: 14 },
      style: {marginBottom: 0}
    };
    const {rebuildlist} = this.props;
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
        <Divider style={{marginBottom:0}} />
        <Card 
          bodyStyle={{padding:0}}
          extra={<Link to="/data/rebuild"> <Button type="primary" icon="plus">New</Button></Link>}
          bordered={false}>
          <Table columns={this.columns}
            loading={rebuildlist.isLoading}
            bordered
            rowKey="id"
            expandedRowRender={record => <div>
              <Row>
                <Col span={12}><span style={{fontSize: 16,color: 'rgba(0, 0, 0, 0.85)'}}>source</span><pre>{JSON.stringify(record.source, null, 2)}</pre></Col>
                <Col span={12}><span style={{fontSize: 16,color: 'rgba(0, 0, 0, 0.85)'}}>dest</span><pre>{JSON.stringify(record.dest, null, 2)}</pre></Col>
              </Row>
            </div>}
            onChange={this.handleTableChange}
            pagination={{
              showSizeChanger: true,
              total: rebuildlist.total?  rebuildlist.total.value: 0,
              pageSize: rebuildlist.pageSize,
              current: rebuildlist.pageIndex,
              showTotal: (total, range) => `Total ${total} items`,
              size: 'small',
            }}
            dataSource={rebuildlist.data}>

          </Table>
        </Card>
      </Card>
    )
  }
}

export default RebuildList;