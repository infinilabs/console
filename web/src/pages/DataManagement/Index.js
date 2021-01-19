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
  Icon, Popconfirm
} from 'antd';
import Editor from '@monaco-editor/react';

import styles from '../List/TableList.less';
import {transformSettingsForApi} from '@/lib/elasticsearch/edit_settings';

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
      console.log(getElementTop(this.refs.jsonw));
    this.setState({height: window.innerHeight - getElementTop(this.refs.jsonw) -50});
  }
  render(){
    return (
    <div id="jsonw" ref="jsonw" onClick={()=>{console.log(document.getElementById('jsonw').offsetTop)}} style={{overflow:"scroll", height: this.state.height}}> {this.props.children}</div>
    )
  }
}

const CreateForm = Form.create()(props => {
  const { modalVisible, form, handleAdd, handleModalVisible } = props;
  const okHandle = () => {
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      form.resetFields();
      handleAdd(fieldsValue);
    });
  };
  return (
    <Modal
      destroyOnClose
      title="新建索引"
      visible={modalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleModalVisible()}
    >
       <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引名称">
        {form.getFieldDecorator('index', {
          rules: [{ required: true, message: '请输入至少五个字符的名称！', min: 5 }],
        })(<Input placeholder="请输入名称" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引设置">
        {form.getFieldDecorator('settings', {
          rules: [{ required: true }],
        })(<TextArea
          style={{ minHeight: 24 }}
          placeholder="请输入"
          rows={9}
      />)}
      </FormItem>
    </Modal>
  );
});

const UpdateForm = Form.create()(props => {
  const { updateModalVisible, handleUpdateModalVisible, handleUpdate,values,form } = props;

  const okHandle = () => {
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      form.resetFields();
      handleUpdate(fieldsValue);
    });
  };
  
  return (
    <Modal
      destroyOnClose
      title="索引设置"
      visible={updateModalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleUpdateModalVisible()}
    >
       <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引名称">
        {form.getFieldDecorator('index', {
          initialValue: values.index,
          rules: [{ required: true, message: '请输入至少五个字符的名称！', min: 5 }],
        })(<Input placeholder="请输入名称" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引设置">
        {form.getFieldDecorator('settings', {
          initialValue: values.processors,
          rules: [{ required: true }],
        })(<TextArea
          style={{ minHeight: 24 }}
          placeholder="请输入"
          rows={9}
      />)}
      </FormItem>
    </Modal>
  );
});

/* eslint react/no-multi-comp:0 */
@connect(({ index }) => ({
  index
}))
@Form.create()
class Index extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    formValues: {},
    updateFormValues: {},
    drawerVisible: false,
    editingIndex:{},
    indexActiveKey: '1',
  };
  columns = [
    {
      title: '索引名称',
      dataIndex: 'index',
      render: (text, record) => (
      <a onClick={()=>{
        this.setState({
          editingIndex: record,
          drawerVisible: true,
        });
      }}>{text}</a>
      )
    },
    {
      title: '文档数',
      dataIndex: 'docs_count',
    },
    {
      title: '主分片数',
      dataIndex: 'shards'
    },
    {
      title: '从分片数',
      dataIndex: 'replicas'
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          {/* <a onClick={() => this.handleUpdateModalVisible(true, record)}>设置</a>
          <Divider type="vertical" /> */}
          <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDeleteClick(record.index)}>
            <a>删除</a>
          </Popconfirm>
          <Divider type="vertical" />
          <Link to={"/data/doc?index=" + record.index}>文档管理</Link>
        </Fragment>
      ),
    },
  ];

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'index/fetchIndices',
      payload: {
        cluster: 'single-es'
      }
    });
  }

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
    });
    dispatch({
      type: 'pipeline/fetch',
      payload: {},
    });
  };

  handleDeleteClick = (indexName) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'index/removeIndex',
      payload: {
        index: indexName
      }
    });
  };

  handleSearch = e => {
    e.preventDefault();
    const { dispatch, form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) return;

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

  handleUpdateModalVisible = (flag, record) => {
    this.setState({
      updateModalVisible: !!flag,
      updateFormValues: record || {},
    });
  };

  handleAdd = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'pipeline/add',
      payload: {
        name: fields.name,
        desc: fields.desc,
        processors: fields.processors,
      },
    });

    message.success('添加成功');
    this.handleModalVisible();
  };

  handleUpdate = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'pipeline/update',
      payload: {
        name: fields.name,
        desc: fields.desc,
        processors: fields.processors,
      },
    });

    message.success('修改成功');
    this.handleUpdateModalVisible();
  };

  renderSimpleForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="索引名称">
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
        </Row>
      </Form>
    );
  }

  renderForm() {
    return this.renderSimpleForm();
  }

  handleIndexTabChanged = (activeKey, indexName) => {
    this.setState({
      indexActiveKey: activeKey,
    })
    const {dispatch} = this.props;
    if(activeKey == '2'){
      if(this.props.index.mappings[indexName]){
        return
      }
      dispatch({
        type: 'index/fetchMappings',
        payload: {
          index: indexName,
        }
      })
    }else if(activeKey == '4'){
      if(this.props.index.settings[indexName]){
        return
      }
      dispatch({
        type: 'index/fetchSettings',
        payload: {
          index: indexName,
        }
      })
    }
  }
  handleEditorDidMount = (_valueGetter)=>{
    this.indexSettingsGetter = _valueGetter;
  }

  handleIndexSettingsSaveClick = (indexName)=>{
    let settings = this.indexSettingsGetter();
    settings = JSON.parse(settings);
    const {dispatch} = this.props;
    dispatch({
      type: 'index/saveSettings',
      payload: {
        index: indexName,
        settings: settings.settings,
      }
    })
  }

  render() {
    const {clusterIndices, settings} = this.props.index;
    let indices = [];
    for(let key in clusterIndices) {
      if(this.state.searchKey){
        if(key.indexOf(this.state.searchKey) > -1){
          indices.push(clusterIndices[key]);
        }
        continue
      }
      indices.push(clusterIndices[key]);
    }
    const { modalVisible, updateModalVisible, updateFormValues,editingIndex, drawerVisible } = this.state;
    const parentMethods = {
      handleAdd: this.handleAdd,
      handleModalVisible: this.handleModalVisible,
    };
    const updateMethods = {
      handleUpdateModalVisible: this.handleUpdateModalVisible,
      handleUpdate: this.handleUpdate,
    };
    let newSettings = {};
    if(settings && settings[editingIndex.index]){
      newSettings = transformSettingsForApi(settings[editingIndex.index], editingIndex.status === 'open')
    }
    
    return (
      <Fragment>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>{this.renderForm()}</div>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true)}>
                新建
              </Button>
            </div>
            <Table bordered
              dataSource={indices}
              rowKey='index'
              pagination={
                {pageSize: 5,}
              }
              columns={this.columns}
            />
          </div>
        </Card>
        <CreateForm {...parentMethods} modalVisible={modalVisible} />
        {updateFormValues && Object.keys(updateFormValues).length ? (
          <UpdateForm
            {...updateMethods}
            updateModalVisible={updateModalVisible}
            values={updateFormValues}
          />
        ) : null}
        <Drawer title={editingIndex.index}
          visible={drawerVisible}
          onClose={()=>{
            this.setState({
              drawerVisible: false,
              indexActiveKey: '1',
            });
          }}
          width={720}
        >
           <Tabs activeKey={this.state.indexActiveKey} onChange={(activeKey)=>{this.handleIndexTabChanged(activeKey, editingIndex.index)}}>
            <TabPane tab="Summary" key="1">
            <Descriptions title="General" column={2}>
              <Descriptions.Item label="Health">{editingIndex.health}</Descriptions.Item>
              <Descriptions.Item label="Status">{editingIndex.status}</Descriptions.Item>
              <Descriptions.Item label="Primaries">{editingIndex.shards}</Descriptions.Item>
              <Descriptions.Item label="Replicas">{editingIndex.replicas}</Descriptions.Item>
              <Descriptions.Item label="Docs Count">{editingIndex.docs_count}</Descriptions.Item>
              <Descriptions.Item label="Docs Deleted">{editingIndex.docs_deleted}</Descriptions.Item>
              <Descriptions.Item label="Storage Size"></Descriptions.Item>
              <Descriptions.Item label="Primary Storage Size"></Descriptions.Item>
              <Descriptions.Item label="Alias">
              </Descriptions.Item>
            </Descriptions>
            </TabPane>
            <TabPane tab="Mappings" key="2">
              <JSONWrapper>
                <div style={{background:'#F5F7FA', color:'#343741', padding:10}}>
                 <pre className="language-json">{JSON.stringify(this.props.index.mappings[editingIndex.index], null, 2)}</pre>
                </div>
              </JSONWrapper>
            </TabPane>
            {/*<TabPane tab="Stats" key="3">*/}
            {/*  Content of Tab Pane 3*/}
            {/*</TabPane>*/}
            <TabPane tab="Edit settings" key="4">
              <div style={{textAlign:'right', marginBottom: 10}}>
                <span style={{marginRight: 30}}>Edit, then save your JSON</span>
                <Button type='primary' onClick={
                ()=>{
                  this.handleIndexSettingsSaveClick(editingIndex.index)
                }
              }>Save</Button></div>
              <div style={{border: '1px solid rgb(232, 232, 232)'}}>
                <Editor
                    height="300px"
                    language="json"
                    theme="light"
                    value={JSON.stringify(newSettings, null, 2)}
                    options={{
                      minimap: {
                        enabled: false,
                      },
                      tabSize: 2,
                      wordBasedSuggestions: true,
                    }}
                    editorDidMount={this.handleEditorDidMount}
                />
              </div>
            </TabPane>
          </Tabs>
          <div style={{position:'absolute', bottom: 10}}>
          <Dropdown 
            placement="topLeft"
            overlay={(
            <Menu onClick={()=>{}}>
              <Menu.Item key="1">
                <Icon type="delete" />
                Delete
              </Menu.Item>
              {/*<Menu.Item key="2">*/}
              {/*  <Icon type="edit" />*/}
              {/*  Edit*/}
              {/*</Menu.Item>*/}
              <Menu.Item key="3">
                <Icon type="close" />
                Close
              </Menu.Item>
            </Menu>
          )}>
            <Button type="primary">
              Manage <Icon type="up" />
            </Button>
          </Dropdown>
          </div>
        </Drawer>
      </Fragment>
    );
  }
}

export default Index;
