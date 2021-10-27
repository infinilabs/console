import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import {Link} from 'umi';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Modal,
  message,
  Divider,
  Drawer,
  Tabs,
  Descriptions,
  Menu,
  Table,
  Dropdown,
  Icon, Popconfirm,
  Switch,
} from 'antd';
import Editor from '@monaco-editor/react';

import styles from '../../List/TableList.less';
import {transformSettingsForApi} from '@/lib/elasticsearch/edit_settings';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

const FormItem = Form.Item;
const { TextArea } = Input;
const {TabPane} = Tabs;

class JSONWrapper extends PureComponent {
  state ={
    height: 400,
  }
  componentDidMount(){
    
    let  getElementTop = (elem)=>{
      　　var elemTop=elem.offsetTop;
      　　elem=elem.offsetParent;
      
      　　while(elem!=null){ 
      　　　　elemTop+=elem.offsetTop;
      　　　　elem=elem.offsetParent;     
      　　}
      
      　　return elemTop;
      
      }
     // console.log(getElementTop(this.refs.jsonw));
    this.setState({height: window.innerHeight - getElementTop(this.refs.jsonw) -50});
  }
  render(){
    return (
    <div id="jsonw" ref="jsonw" onClick={()=>{console.log(document.getElementById('jsonw').offsetTop)}} style={{overflow:"scroll", height: this.state.height}}> {this.props.children}</div>
    )
  }
}
@Form.create()
class CreateForm extends React.Component {
  okHandle = () => {
    const {handleAdd, form} = this.props;
    const me = this;

    form.validateFields((err, fieldsValue) => {
      if (err) return;
      fieldsValue['config'] = me.editor.getValue();
      handleAdd(fieldsValue);
      form.resetFields();
    });
  };
  onEditorDidMount = (editor)=>{
    this.editor = editor;
  }

  render() {
    const {modalVisible, form, handleModalVisible} = this.props;
    return (
        <Modal
            destroyOnClose
            title="新建索引"
            visible={modalVisible}
            width={640}
            onOk={this.okHandle}
            onCancel={() => handleModalVisible()}
        >
          <FormItem labelCol={{span: 5}} wrapperCol={{span: 15}} label="索引名称">
            {form.getFieldDecorator('index', {
              rules: [{required: true, message: '请输入至少五个字符的名称！', min: 5}],
            })(<Input placeholder="请输入名称"/>)}
          </FormItem>
          <FormItem labelCol={{span: 5}} wrapperCol={{span: 15}} label="索引设置">
            <div style={{border: '1px solid rgb(232, 232, 232)'}}>
              <Editor
                  height="300px"
                  language="json"
                  theme="light"
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    tabSize: 2,
                    wordBasedSuggestions: true,
                  }}
                  onMount={this.onEditorDidMount}
              />
            </div>
          </FormItem>
        </Modal>
    );
  }
}


/* eslint react/no-multi-comp:0 */
@connect(({ command }) => ({
  command
}))
@Form.create()
class Index extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    formValues: {},
    drawerVisible: false,
    editingCommand:{},
    indexActiveKey: '1',
    showSystemIndices: false,
  };
  columns = [
    {
      title: '名称',
      dataIndex: 'title',
      render: (text, record) => (
      <a onClick={()=>{
        this.setState({
          editingCommand: record,
          drawerVisible: true,
        });
      }}>{text}</a>
      )
    },
    {
      title: '标签',
      dataIndex: 'tag',
      // render: (val)=>{
      //   return val || 0;
      // }
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDeleteClick(record.id)}>
            <a>删除</a>
          </Popconfirm>
        </Fragment>
      ),
    },
  ];

  componentDidMount() {
    this.fetchData()
  }

  fetchData = (params={})=>{
    const { dispatch } = this.props;
    dispatch({
      type: 'command/fetchCommandList',
      payload: {
        ...params
      }
    });
  }

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
    });
  };

  handleDeleteClick = (id) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'command/removeCommand',
      payload: {
        id: id,
      }
    });
  };

  handleSearch = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.fetchData({
        title: fieldsValue.name,
        from: 0,
        size: 10,
      })
      this.setState({
        searchKey: fieldsValue.name,
      });
    });
  };

  handleModalVisible = flag => {
    this.setState({
      modalVisible: !!flag,
    });
  };

  handleIndexTabChanged = (activeKey, indexName) => {
  }
  handleEditorDidMount = (editorName, editor)=>{
    this[editorName] = editor;
  }

  handleIndexSettingsSaveClick = (indexName)=>{
  }
  buildRawCommonCommandRequest(cmd){
    const {requests} = cmd;
    if(!requests){
      return '';
    }
    const strReqs = requests.map((req)=>{
      const {method, path, body} = req;
      return `${method} ${path}\n${body}`;
    })
    return strReqs.join('\n');
  }
  handleRereshClick=()=>{
    const {searchKey} = this.state;
    this.fetchData({
      title: searchKey,
    })
  }

  render() {
    const {data, total} = this.props.command;
    const { modalVisible, updateModalVisible, updateFormValues, drawerVisible, editingCommand } = this.state;
    const parentMethods = {
      handleAdd: this.handleAdd,
      handleModalVisible: this.handleModalVisible,
    };
    const updateMethods = {
      handleUpdateModalVisible: this.handleUpdateModalVisible,
      handleUpdate: this.handleUpdate,
    };
    const {form: { getFieldDecorator }} = this.props;
    
    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>
              <Form onSubmit={this.handleSearch} layout="inline">
                <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
                  <Col md={8} sm={24}>
                    <FormItem label="名称">
                      {getFieldDecorator('name')(<Input placeholder="请输入" />)}
                    </FormItem>
                  </Col>
                  <Col md={8} sm={24}>
                    <span className={styles.submitButtons}>
                      <Button type="primary" htmlType="submit">
                        查询
                      </Button>
                      <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                        重置
                      </Button>
                    </span>
                  </Col>
                  <Col md={8} sm={24} style={{textAlign:"right"}}>
                    <Button icon="redo" style={{marginRight:10}} onClick={this.handleRereshClick}>刷新</Button>
                  </Col>
                </Row>
              </Form>
            </div>
           
            <Table bordered
              dataSource={data}
              rowKey='id'
              pagination={
                {pageSize: 10,}
              }
              columns={this.columns}
            />
          </div>
        </Card>
        <CreateForm {...parentMethods} modalVisible={modalVisible} />
        <Drawer title={editingCommand.title}
          visible={drawerVisible}
          onClose={()=>{
            this.setState({
              drawerVisible: false,
              indexActiveKey: '1',
            });
          }}
          width={720}
        >
          <div style={{border: '1px solid rgb(232, 232, 232)'}}>
            <Editor
                height="300px"
                language="text"
                theme="light"
                value={this.buildRawCommonCommandRequest(editingCommand)}
                options={{
                  readOnly: true,
                  minimap: {
                    enabled: false,
                  },
                  tabSize: 2,
                  wordBasedSuggestions: true,
                }}
                onMount={(editor)=>this.handleEditorDidMount('indexSettingsEditor', editor)}
            />
          </div>
        </Drawer>
      </PageHeaderWrapper>
    );
  }
}

export default Index;
