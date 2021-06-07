import  React from 'react';
import {Button, Card, Col, Divider, Form, Input, Row, Table, Switch, Icon, Popconfirm, message} from "antd";
import Link from "umi/link";
import {connect} from "dva";

const HealthStatusCircle = ({status})=>{
  return <div style={{background: status, height:14, width:14, borderRadius: 14, boxShadow: '0px 0px 5px #555'}}></div>
}

@Form.create()
@connect(({clusterConfig}) =>({
  clusterConfig
}))
class Index extends  React.Component {
  columns = [{
    title: '集群名称',
    dataIndex: 'name',
    key: 'name',
  },{
    title: '健康状态',
    dataIndex: 'status.health_status',
    key: 'health_status',
    render: (val)=>{
      return <HealthStatusCircle  status={val}/>
    }
  },{
    title: '所属业务',
    dataIndex: 'business',
    key: 'business',
    render: ()=>{
      return 'eu-de-1'
    }
  },
  {
    title: '所属部门',
    dataIndex: 'business_department',
    key: 'business_department',
    render: ()=>{
      return '部门X'
    }
  }, {
    title: '部署环境',
    dataIndex: 'business_department',
    key: 'business_department',
    render: ()=>{
      return 'PROD'
    }
  },{
    title: '程序版本',
    dataIndex: 'status.version',
    key: 'elasticsearch_version',
    // render: (data)=>{
    //   return 
    // }
  },{
    title: '节点数',
    dataIndex: 'node_count',
    key: 'mode_count',
    render: ()=>{
      return 1;
    }
  },{
    title: '集群地址',
    dataIndex: 'endpoint',
    key: 'endpoint',
  },
  {
      title: '监控启用状态',
      dataIndex: 'monitored',
      key: 'monitored',
      render: (val) => {
        return val? '是': '否';
      }
    },
  // {
  //   title: '是否需要身份验证',
  //   dataIndex: 'basic_auth',
  //   key: 'username',
  //   render: (val) => {
  //     //console.log(val)
  //     return (val && typeof val.username !=='undefined' && val.username !== '')? '是': '否';
  //   }
  // },
  // {
  //   title: '描述',
  //   dataIndex: 'description',
  //   key: 'description',
  // },{
  //   title: '是否启用',
  //   dataIndex: 'enabled',
  //   key: 'enabled',
  //   render: (val) =>{
  //     return val === true ? '是': '否';
  //   }
  // },
  {
    title: '操作',
    render: (text, record) => (
      <div>
        <Link to='/system/cluster/edit' onClick={()=>{this.handleEditClick(record)}}>编辑</Link>
        <span><Divider type="vertical" />
          <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDeleteClick(record)}><a key="delete">删除</a>
         </Popconfirm>
          </span>
      </div>
    ),
  }]

  fetchData = (params)=>{
    const {dispatch} = this.props;
    dispatch({
      type: 'clusterConfig/fetchClusterList',
      payload: params,
    })
  }
  componentDidMount() {
    const {dispatch} = this.props;
    dispatch({
      type: 'clusterConfig/fetchClusterStatus',
    }).then(()=>{
      if(typeof this.props.clusterConfig.data === 'undefined') {
        this.fetchData({})
      }
    })
  
  }

  handleSearchClick = ()=>{
    const {form} = this.props;
    this.fetchData({
      name: form.getFieldValue('name'),
    })
  }

  handleDeleteClick = (record)=>{
    const {dispatch} = this.props;
    return dispatch({
      type:'clusterConfig/deleteCluster',
      payload: {
        id: record.id
      }
    }).then((result)=>{
      if(result){
        message.success("删除成功");
      }
    });
  }

  saveData = (payload)=>{
    const {dispatch} = this.props;
    return dispatch({
      type:'clusterConfig/saveData',
      payload: {
        ...payload
      }
    });
  }
  handleNewClick = () => {
    this.saveData({
      editMode: 'NEW',
      editValue: {basic_auth: {}},
    })
  }
  handleEditClick = (record)=>{
    this.saveData({
      editMode : 'UPDATE',
      editValue: record,
    })
  }

  handleEnabledChange = (enabled) => {
    const {form} = this.props;
    this.fetchData({
      name: form.getFieldValue('name'),
      enabled: enabled,
    })
  }

  render() {
    const {getFieldDecorator} = this.props.form;
    const formItemLayout = {
      labelCol: { span: 10 },
      wrapperCol: { span: 14 },
      style: {marginBottom: 0}
    };
    const {data} = this.props.clusterConfig;
    return (
      <Card>
        <div style={{display:'flex', marginBottom:10, flex:"1 1 auto", justifyContent: 'space-between'}}>
            <div>
              <Form>
                <Row gutter={{md:24, sm:16}}>
                  <Col md={16} sm={20}>
                    <Form.Item {...formItemLayout} label="集群名称">
                      {getFieldDecorator('name')(<Input placeholder="please input cluster name" />)}
                    </Form.Item>
                  </Col>
                  <Col md={8} sm={16}>
                    <div style={{paddingTop:4}}>
                      <Button type="primary" icon="search" onClick={this.handleSearchClick}>
                        搜索
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </div>
            <div>
              <span style={{marginRight:24}}><Switch
                checkedChildren={<Icon type="check" />}
                unCheckedChildren={<Icon type="close" />}
                onChange={this.handleEnabledChange}
                defaultChecked
              />是否启用</span>
            <Link to='/system/cluster/edit' onClick={this.handleNewClick}> <Button type="primary" icon="plus">新建集群</Button></Link>
            </div>
          </div>
          <Table
            bordered
            columns={this.columns}
            dataSource={data}
            rowKey='id'
          />
      </Card>
    );
  }

}

export default  Index;
