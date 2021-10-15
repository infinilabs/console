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

import styles from '../List/TableList.less';
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
@connect(({ index,global }) => ({
  index,
  clusterID: global.selectedClusterID,
}))
@Form.create()
class Index extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    formValues: {},
    drawerVisible: false,
    editingIndex:{},
    indexActiveKey: '1',
    showSystemIndices: false,
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
      render: (val)=>{
        return val || 0;
      }
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
          {/* <Divider type="vertical" />
          <Link to={"/data/document?index=" + record.index}>文档管理</Link> */}
        </Fragment>
      ),
    },
  ];

  componentDidMount() {
    this.fetchData()
  }
  componentDidUpdate(oldProps,newState,snapshot){
    if(oldProps.clusterID != this.props.clusterID){
      this.fetchData()
    }
  }

  fetchData = ()=>{
    const { dispatch, clusterID } = this.props;
    dispatch({
      type: 'index/fetchIndices',
      payload: {
        clusterID:  clusterID,
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

  handleDeleteClick = (indexName) => {
    const { dispatch,clusterID } = this.props;
    dispatch({
      type: 'index/removeIndex',
      payload: {
        index: indexName,
        clusterID,
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

  handleAdd = fields => {
    const { dispatch, clusterID} = this.props;
    dispatch({
      type: 'index/addIndex',
      payload: {
        index: fields.index,
        config: JSON.parse(fields.config || '{}'),
        clusterID
      },
    });
    this.handleModalVisible();
  };

  handleIndexTabChanged = (activeKey, indexName) => {
    this.setState({
      indexActiveKey: activeKey,
    })
    const {dispatch, clusterID} = this.props;
    if(activeKey == '2'){
      if(this.props.index.mappings[indexName]){
        return
      }
      dispatch({
        type: 'index/fetchMappings',
        payload: {
          index: indexName,
          clusterID,
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
          clusterID,
        }
      })
    }
  }
  handleEditorDidMount = (editorName, editor)=>{
    this[editorName] = editor;
  }

  handleIndexSettingsSaveClick = (indexName)=>{
    let settings = this.indexSettingsEditor.getValue();
    settings = JSON.parse(settings);
    const {dispatch,clusterID} = this.props;
    dispatch({
      type: 'index/saveSettings',
      payload: {
        index: indexName,
        settings: settings,
        clusterID,
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
    if(!this.state.showSystemIndices){
      indices = indices.filter(item=>!item.index.startsWith('.'));
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
      if(settings[editingIndex.index].settings) {
        newSettings = transformSettingsForApi(settings[editingIndex.index], editingIndex.status === 'open')
      }else{
        newSettings = settings[editingIndex.index];
      }
    }
    const {form: { getFieldDecorator }} = this.props;
    
    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>
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
                  <Col md={8} sm={24} style={{textAlign:"right"}}>
                    <Button icon="redo" style={{marginRight:10}} onClick={()=>{this.fetchData()}}>刷新</Button>
                    <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true)}>
                      新建
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>
            <div className={styles.tableListOperator}>
              <div style={{marginLeft:'auto'}}>显示系统索引<Switch style={{marginLeft:5}} 
                onChange={(checked)=>{this.setState({showSystemIndices:checked})}}
               defaultChecked={this.state.showSystemIndices}/></div>
            </div>
            <Table bordered
              dataSource={indices}
              rowKey='index'
              pagination={
                {pageSize: 10,}
              }
              columns={this.columns}
            />
          </div>
        </Card>
        <CreateForm {...parentMethods} modalVisible={modalVisible} />
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
            <TabPane tab="概览" key="1">
            <Descriptions column={2}>
              <Descriptions.Item label="健康">{editingIndex.health}</Descriptions.Item>
              <Descriptions.Item label="状态">{editingIndex.status}</Descriptions.Item>
              <Descriptions.Item label="主分片数">{editingIndex.shards}</Descriptions.Item>
              <Descriptions.Item label="副分片数">{editingIndex.replicas}</Descriptions.Item>
              <Descriptions.Item label="文档数">{editingIndex.docs_count}</Descriptions.Item>
              <Descriptions.Item label="删除文档数">{editingIndex.docs_deleted}</Descriptions.Item>
              <Descriptions.Item label="存贮大小">{editingIndex.store_size}</Descriptions.Item>
              <Descriptions.Item label="主存贮大小">{editingIndex.pri_store_size}</Descriptions.Item>
              {/* <Descriptions.Item label="别名">
              </Descriptions.Item> */}
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
                    onMount={(editor)=>this.handleEditorDidMount('indexSettingsEditor', editor)}
                />
              </div>
            </TabPane>
          </Tabs>
          <div style={{position:'absolute', bottom: 10}}>
          <Dropdown 
            placement="topLeft"
            overlay={(
            <Menu>
              <Menu.Item key="1">
                <Popconfirm onConfirm={()=>{
                  this.handleDeleteClick(editingIndex.index);
                  this.setState({drawerVisible: false})
                }} title="sure to delete ?">
                  <Icon type="delete" />
                  Delete
                </Popconfirm>
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
      </PageHeaderWrapper>
    );
  }
}

export default Index;
