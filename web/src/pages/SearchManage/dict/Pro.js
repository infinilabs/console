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
      let upVals = Object.assign(_.cloneDeep(values), fieldsValue);
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
  componentDidMount(){
    const {size} = this.props.dict.search;
    this.fetchData({
      from: 0,
      size: size,
    });
  }

  handleReset = ()=>{
    const {form} = this.props;
    form.resetFields();
    this.fetchData({
      from: 0,
      size: this.props.dict.search.size,
      name: '',
      tags: ''
    });
  }

  handleSearch = ()=>{
    const {form} = this.props;
    let me = this;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
        me.fetchData({
          form: 0,
          size: me.props.dict.search.size,
          name: fieldsValue.name,
          tags: fieldsValue.tags.join(',')
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
    const {dispatch} = this.props;
    dispatch({
      type: 'dict/saveData',
      payload: {
        currentFormOp: 'NEW',
        updateFormValues: {},
        formTitle: '添加词典'
      }
    })
  }

  handleDelete = (item) =>{
    const {dispatch, dict} = this.props;
    const search = dict.search;
    const me = this;
    Modal.confirm({
      title: '删除词典',
      content: '确定删除该词典吗？',
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
    const {dispatch} = this.props;
    dispatch({
      type: 'dict/saveData',
      payload: {
        updateFormValues: item,
        formTitle: '修改词典',
        currentFormOp: 'UPDATE',
      }
    });
  }

  handleUpdate(values){
    let {currentFormOp} = this.props.dict;
    const {dispatch} = this.props;
    let me = this;
    switch(currentFormOp){
      case "NEW":
        dispatch({
          type: 'dict/addDictItem',
          payload: values,
        });
        break;
      case "UPDATE":
        dispatch({
          type: 'dict/updateDictItem',
          payload: values,
        });
    }
  }

  fetchData = (params)=>{
    const {dispatch} = this.props;
    dispatch({
      type: 'dict/fetchDictList',
      payload: params
    });
  }

  handlePageChange = (p)=>{
    let search = this.props.dict.search;

    this.fetchData({
      ...search,
      from: (p-1) * search.size,
      pageIndex: p,
    });
  }

  render(){
    //console.log('render');
    let {dictList, search, updateFormValues, total, formTitle} = this.props.dict;
    let {pageIndex, size} = search;
    const {dispatch} = this.props;
    const updateMethods = {
      handleUpdate: this.handleUpdate,
      handleUpdateModalVisible: ()=>{
        dispatch({
          type:'dict/saveData',
          payload: {
            updateFormValues: null,
            currentFormOp: null,
          }
        });
      }
    };
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
          dataSource={dictList}
          pagination={{
            pageSize: size,
            total: total,
            current: pageIndex,
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
            title={formTitle}
            {...updateMethods}
            values={updateFormValues}
          />
        ) : null}
      </div>
    )
  }
}

export default Pro;