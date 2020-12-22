import React from 'react';
import {Form, Row, Col, Select,Input, Button, Card,List,Avatar, Modal} from 'antd';
import Link from 'umi/link';
import {connect} from 'dva'
import moment from 'moment';

const {Option} = Select;
import styles from './Pro.less';


const UpdateForm = Form.create()(props => {
  const { handleUpdateModalVisible, handleUpdate,values,form, title} = props;

  const okHandle = () => {
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      form.resetFields();
      let upVals = Object.assign(values, fieldsValue);
      handleUpdate(upVals);
    });
  };
  
  return (
    <Modal
      destroyOnClose
      title={title}
      width={640}
      visible={true}
      onOk={okHandle}
      onCancel={() => handleUpdateModalVisible()}
    >
       <Form.Item labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="词典名称">
        {form.getFieldDecorator('name', {
          initialValue: values.name,
          rules: [{ required: true, message: '请输入至少五个字符的名称！' }],
        })(<Input placeholder="请输入名称" />)}
      </Form.Item>
      <Form.Item labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="词典标签">
        {form.getFieldDecorator('tags', {
          initialValue: values.tags,
          rules: [{ required: false }],
        })(<Select mode="multiple" style={{width:'100%'}}>
          <Option value="铁路">铁路</Option>
          <Option value="客运">客运</Option>
          <Option value="货运">货运</Option>
          <Option value="线路">线路</Option>
        </Select>)}
      </Form.Item>
      <Form.Item labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="内容">
        {form.getFieldDecorator('content', {
          initialValue: values.content,
          rules: [{ required: true }],
        })(<Input.TextArea
          style={{ minHeight: 24 }}
          placeholder="请输入"
          rows={9}
      />)}
      </Form.Item>
    </Modal>
  );
});

@connect(({dict})=>({
  dict
}))
@Form.create()
class Pro extends React.Component {
  constructor(props){
    super(props);
    this.handleUpdate = this.handleUpdate.bind(this);
  }
  state = {
    updateFormValues: null,
    currentFormOp: null,
    data: [],
    search: {
      size: 6,
      name: "",
      tags: "",
      pageIndex: 1,
    }
  }
  componentDidMount(){
    this.fetchData();
  }

  handleReset = ()=>{
    const {form} = this.props;
    form.resetFields();
    this.setState({
      search: {
        size: 6,
        name: "",
        tags: "",
        pageIndex: 1,
      }
    },()=>{
      this.fetchData();
    });
  }

  handleSearch = ()=>{
    const {form} = this.props;
    let me = this;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      me.setState({search:{
          ...me.state.search,
          pageIndex: 1,
          name: fieldsValue.name,
          tags: fieldsValue.tags.join(',')
      }},()=>{
        me.fetchData();
      })
    })
  }

  renderForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    const formItemLayout = {
      labelCol: { span: 10 },
      wrapperCol: { span: 14 },
      style: {marginBottom: 0}
    };
    return (
      <Form>
        <Row gutter={{md:16, sm:8}}>
          <Col md={10} sm={8}>
            <Form.Item {...formItemLayout} label="词典标签" >
              {getFieldDecorator('tags', {
                 // rules: [{ required: true, message: '请选择词典标签' }],
              })(
                 <Select placeholder="请选择词典标签"  mode="multiple">
                    <Option value="铁路">铁路</Option>
                    <Option value="客运">客运</Option>
                    <Option value="货运">货运</Option>
                    <Option value="线路">线路</Option>
                  </Select>
              )}
            </Form.Item>
          </Col>
          <Col md={6} sm={8}>
            <Form.Item {...formItemLayout} label="词典名称">
              {getFieldDecorator('name')(<Input placeholder="请输入词典名称" />)}
            </Form.Item>
          </Col>
          <Col md={8} sm={8}>
            <div style={{paddingTop:4}}>
              <Button type="primary" onClick={this.handleSearch}>
                查询
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={this.handleReset}>
                重置
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    );
  }
  handleNewClick = () => {
    this.setState({
      currentFormOp: 'NEW',
      updateFormValues: {},
      formTitle: '添加词典'
    })
  }

  handleDelete = (item) =>{
    const {dispatch} = this.props;
    Modal.confirm({
      title: '删除Pipeline',
      content: '确定删除该Pipeline吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        dispatch({
          type: 'dict/deleteDictItem',
          payload: {
            id: item.id,
          }
        })
      },
    });
    
  }
  
  handleModifyClick = (item)=>{
    this.setState({
      updateFormValues: item,
      formTitle: '修改词典',
      currentFormOp: 'UPDATE',
    })
  }

  handleUpdate(values){
    let {currentFormOp, data} = this.state;
    const {dispatch} = this.props;
    let me = this;
    switch(currentFormOp){
      case "NEW":
        dispatch({
          type: 'dict/addDictItem',
          payload: values,
          callback: ()=>{
            me.setState({
              updateFormValues: null,
              currentFormOp: null
            });
          }
        });
        break;
      case "UPDATE":
        dispatch({
          type: 'dict/updateDictItem',
          payload: values,
          callback: ()=>{
            me.setState({
              updateFormValues: null,
              currentFormOp: null
            });
          }
        });
    }
  }

  fetchData = ()=>{
    const {dispatch} = this.props;
    let {size, pageIndex} = this.state.search;
    let me = this;
    dispatch({
      type: 'dict/fetchDictList',
      payload: {
        from: (pageIndex - 1) * size,
        ...this.state.search
      },
      callback: ()=>{
      }
    });
  }

  handlePageChange = (p)=>{
    this.setState({
      search: {
        ...this.state.search,
        pageIndex: p,
      }
    },()=>{
      this.fetchData();
    })
  }

  render(){
    let data = this.props.dict ? this.props.dict.dictList : [];
    let total = this.props.dict ? this.props.dict.total: 0;
    let updateFormValues = this.state.updateFormValues;
    let size = this.state.search.size;
    const updateMethods = {
      handleUpdate: this.handleUpdate,
      handleUpdateModalVisible: ()=>{
        this.setState({
          updateFormValues: null,
          currentFormOp: null,
        })
      }
    };
    console.log('render');
    return (
      <div>
        <Card bordered={false} bodyStyle={{paddingBottom:0}} >
          {this.renderForm()}
        </Card>
        <Card title="专业词典" 
          bodyStyle={{padding:0, paddingBottom: 24}}
          extra={<div><Button type="primary" icon="plus" onClick={this.handleNewClick}>新建</Button></div>}
          bordered={false}>
          <List
          className="dic-list"
          dataSource={data}
          pagination={{
            pageSize: size,
            total: total,
            current: this.state.search.pageIndex,
            onChange: this.handlePageChange
          }}
          grid={{
           gutter: 0,
            xs: 1,
            sm: 2,
            md: 3,
            lg: 3,
            xl: 3,
            xxl: 3,
          }}
          renderItem={item => (
            <List.Item className={styles['list-item']}>
              <div className={styles.cardTitle}>
                <Avatar size="small" src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1606239682187&di=8dcf007d76393225eea97898cb87401e&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_origin_min_pic%2F00%2F16%2F78%2F8756af452585a1b.jpg" />
                <Link to="">{item.name}</Link>
              </div>
              <div className={styles.desc}>词条样例：{item.content}
              </div>
              <div style={{paddingBottom: 10}}>
                <span className={styles.datetime}>
                  更新时间： {moment(item.updated_at).format("YYYY-MM-DD HH:mm") }
                </span>
              </div>
              <div>
                <span>
                  <Button type="primary" htmlType="submit" onClick={()=>this.handleModifyClick(item)}>修改</Button>
                  <Button style={{ marginLeft: 8 }} onClick={()=>{this.handleDelete(item)}}>删除</Button>
                </span>
              </div>
            </List.Item>
          )}>
            
          </List>
          </Card>
          {updateFormValues ? (
          <UpdateForm
            title={this.state.formTitle}
            {...updateMethods}
            values={updateFormValues}
          />
        ) : null}
      </div>
    )
  }
}

export default Pro;