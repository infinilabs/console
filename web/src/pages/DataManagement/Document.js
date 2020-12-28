import React, { Component, createRef } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import { Col, Form, Row,Select, Input, Card,Icon, Table, InputNumber, Popconfirm,
   Divider,Button,Tooltip, Cascader, Modal } from 'antd';
import Editor, {monaco} from '@monaco-editor/react';

import {createDependencyProposals} from './autocomplete';

function findParentIdentifier(textUntilPosition){
  let chars = textUntilPosition;
  let length = chars.length;
  let stack = [];
  let targetIdx = -1;
  for(let i = length-1; i>-1; i--){
    if(chars[i] == '}'){
      stack.push('}');
    }else if(chars[i] == '{'){
      if(stack.length == 0){
        targetIdx = i;
        break;
      }
      stack.pop();
    }
  }
  let foundColon = false;
  for(let i = targetIdx; i > -1; i--){
    if(chars[i] == ":"){
      targetIdx = i;
      foundColon = true;
      break;
    }
  }
  if(!foundColon){
    return ""
  }
  let identifer = [];
  let startFound = false;
  for(let i = targetIdx; i > -1; i--){
    if((chars[i]>='a' && chars[i] <= 'z') || chars[i] == '_'){
      identifer.push(chars[i]);
      startFound = true;
    }else if(startFound){
      break;
    }
  }
  return identifer.reverse().join('');
}

monaco.init().then((mi)=>{
  mi.languages.registerCompletionItemProvider('json', {
    provideCompletionItems: function(model, position) {
        // find out if we are completing a property in the 'dependencies' object.
        var textUntilPosition = model.getValueInRange({startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column});
        
        if(textUntilPosition.indexOf('{') < 0){
          return { suggestions: [] };
        }
        
        let key = findParentIdentifier(textUntilPosition);
        //console.log(key);
        // var match = textUntilPosition.match(/"match"\s*:\s*\{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*([^"]*)?$/);
        // if (!match) {
        //     return { suggestions: [] };
        // }
        var word = model.getWordUntilPosition(position);
        
        var range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
        };
        return {
            suggestions: createDependencyProposals(key, range, mi)
        };
    }
  });

})

const {Option} = Select;

const EditableContext = React.createContext();

class EditableCell extends React.Component {
    getInput = () => {
      let {record, dataIndex} = this.props;
      if (typeof record[dataIndex] === 'number') {
        return <InputNumber />;
      }
      return <Input />;
    };
  
    renderCell = ({ getFieldDecorator }) => {
      const {
        editing,
        dataIndex,
        title,
        record,
        index,
        children,
        ...restProps
      } = this.props;
      return (
        <td {...restProps}>
          {editing ? (
            <Form.Item style={{ margin: 0 }}>
              {getFieldDecorator(dataIndex, {
                rules: [
                  {
                    required: true,
                    message: `Please Input ${title}!`,
                  },
                ],
                initialValue: record[dataIndex],
              })(this.getInput())}
            </Form.Item>
          ) : (
            children
          )}
        </td>
      );
    };
  
    render() {
      return <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>;
    }
  }

  @Form.create()
  class EditableTable extends React.Component {
    constructor(props) {
      super(props);
      this.operField =  {
        title: 'operation',
        dataIndex: 'operation',
        render: (text, record) => {
          const { editingKey } = this.props.doclist;
          const editable = this.isEditing(record);
          return editable ? (
            <span>
              <EditableContext.Consumer>
                {form => (
                  <a
                    onClick={() => this.save(form, record.id)}
                    style={{ marginRight: 8 }}
                  >
                    Save
                  </a>
                )}
              </EditableContext.Consumer>
              <Popconfirm title="Sure to cancel?" onConfirm={() => this.cancel(record.id)}>
                <a>Cancel</a>
              </Popconfirm>
            </span>
          ) : (<div>
            <a disabled={editingKey !== ''} onClick={() => this.edit(record)}>
              Edit
            </a>
            <Divider type="vertical"/>
              <Popconfirm title="Sure to delete?" onConfirm={() => this.delete(record)}>
                <a>Delete</a>
              </Popconfirm>
           </div>
          );
        },
      };
    }
  
    isEditing = record => record.id === this.props.doclist.editingKey;
  
    cancel = () => {
      const {dispatch, doclist} = this.props;
      if(!doclist.isAddNew){
        dispatch({
          type: 'document/saveData',
          payload: { editingKey: '' },
        });
      }else{
        dispatch({
          type: 'document/cancelNew',
          payload: {},
        });
      }
    };
  
    save(form, key) {
      const {dispatch,doclist} = this.props;
      form.validateFields((error, row) => {
        if (error) {
          return;
        }
        //console.log(row, key, doclist._index);
        if(!doclist.isAddNew){
          dispatch({
            type: 'document/saveDocItem',
            payload: {
              index: doclist._index,
              data: {
                id: key,
                ...row,
              }
            }
          })
        }else{
          dispatch({
            type: 'document/addDocItem',
            payload: {
              index: doclist._index,
              data: row,
            }
          })
        }
      });
    }
  
    edit(record) {
      const {dispatch} = this.props;
      dispatch({
        type: 'document/saveData',
        payload: { editingKey: record.id, _index: record._index }
      });
    }

    delete(record) {
      const {dispatch} = this.props;
      dispatch({
        type: 'document/deleteDocItem',
        payload: {
          index: record._index,
          data: {
            id: record.id,
          }
        }
      });
    }
    handlePageChange = (pageIndex)=>{
      const {fetchData, doclist} = this.props;
      fetchData({
        pageIndex: pageIndex,
        pageSize: doclist.pageSize,
        index: doclist.index,
        cluster: doclist.cluster,
        filter: doclist.filter,
      })
    }

    onShowSizeChange(current, pageSize) {
      console.log(current, pageSize);
    }    
  
    render() {
      let {doclist} = this.props;
      let columns = [];
      if(doclist.data && doclist.data.length > 0 ){
        for(let key in doclist.data[0]){
          if(["_index"].includes(key)){
            continue;
          }
          let col = {
            title: key,
            dataIndex: key,
            ellipsis: true,
            render: (text)=>(<Tooltip placement="top" title={text}>{text}</Tooltip>),
            onCell: record => ({
              record,
              dataIndex: key,
              title: key,
              editing: this.isEditing(record),
              // onMouseEnter: event => {console.log(event)}, 
              // onMouseLeave: event => {},
            }),
          }
          if(["id"].includes(key)){
            col.onCell = "";
          }
          columns.push(col)
        }
      }
      columns.push(this.operField);
      //console.log(columns);
     
      const components = {
        body: {
          cell: EditableCell,
        },
      };
      return (
        <EditableContext.Provider value={this.props.form}>
          <Table
            components={components}
            bordered
            rowKey="id"
            size="small"
            loading={doclist.isLoading}
            dataSource={doclist.data}
            columns={columns}
            rowClassName="editable-row"
            pagination={{
              onChange: this.cancel,
              //showSizeChanger: true,
              //onShowSizeChange: this.onShowSizeChange,
              total: doclist.total?  doclist.total.value: 0,
              pageSize: doclist.pageSize,
              current: doclist.pageIndex,
              onChange: this.handlePageChange,
              showTotal: (total, range) => `Total ${total} items`,
              size: 'small',
            }}
          />
        </EditableContext.Provider>
      );
    }
  }


@connect(({document})=>({
  document
}))
@Form.create()
class Doucment extends React.Component {
  state={
    bodyDisplay: 'none',
  }
  // constructor(props){
  //   super(props);
  //   this.filterGetter = createRef();
  // }
  
  fetchData = (params) => {
    const {dispatch} = this.props;
    return dispatch({
      type: 'document/fetchDocList',
      payload: params,
    })
  }

  handleEditorDidMount = (_valueGetter) =>{
    this.filterGetter = _valueGetter;
  }
  
  componentDidMount(){
    const {location } = this.props;
    //console.log(match, location);
    let index = location.query.index || 'infini-test';
    let cluster = location.query.cluster || 'single-es';
    this.indexEl.setState({
      value: [cluster, index]
    })
    this.fetchData({
        pageSize: 10,
        pageIndex: 1,
        index,
    })
  }
  
  handleNewClick = ()=>{
    const {dispatch, document} = this.props;
    if(!document.data || document.data.length == 0 || document.isAddNew){
      return;
    }
    let {indices} = document;
    let _index = indices[0];
    if(indices && indices.length > 1){
      console.log(this.indexSelEl);
      let vals = this.indexSelEl.rcSelect.state.value;
      if(vals.length == 0){
        Modal.error({
          title: '系统提示',
          content: '请选择新建文档目标索引',
        });
        return
      }else{
        _index = vals[0];
      }
    }
    let keys = Object.keys(document.data[0])
    let newDoc = {};
    for(let key of keys){
      newDoc[key] = ""
    }
    dispatch({
      type: 'document/_addNew',
      payload: {
        docItem: newDoc,
        extra: {
          isAddNew: true,
          _index
        }
      },
    })
  }

  handleSearchClick = (value)=>{
    let [cluster, index] = this.indexEl.state.value;
    let rewriteIndex = this.reindexEl.state.value;
    if(typeof rewriteIndex !== 'undefined' && rewriteIndex !=""){
      index = rewriteIndex;
    }

    this.fetchData({
      cluster,
      index: index,
      pageSize: 10,
      pageIndex: 1,
      //filter: this.filterEl.state.value,
      filter: this.filterGetter(),
      keyword: value,
    }).then(()=>{
      if(this.hashChanged){
        router.push(`/data/doc?index=${index}`);
        this.hashChanged = !this.hashChanged;
      }
    })
    
  }

  renderNew = ()=>{
    const {indices} = this.props.document;
    // if((indices && indices.length > 1)){
    //   return;
    // }
    return (
      <div>
        {(indices && indices.length > 1) ? (<Select ref={el=>{this.indexSelEl=el}} style={{width: 200, marginRight:5}} placeholder="please select a index">
          {indices.map(item=>{
            return (<Select.Option key={item} label={item}>{item}</Select.Option>)
          })}
        </Select>) : ''}
        <Button type="primary" icon="plus" onClick={this.handleNewClick}>新建</Button>
      </div>
    )
  }

  render(){
      // const {getFieldDecorator} = this.props.form;
      //console.log(this.props.document);
      const options =[
        {
          value: 'single-es',
          label: 'single-es',
          children: [
            {
              value: 'infini-test',
              label: 'infini-test',
            },
            {
              value: 'infini-test1',
              label: 'infini-test1',
            }
        ]}];
      return (
          <div>
              <Card>
                  <Row gutter={[16, { xs: 8, sm: 16, md: 24, lg: 32 }]}>
                      <Col span={20} style={{paddingLeft:0}}>
                      <Input.Group compact>
                          <Cascader
                            options={options}
                            ref={el=>{this.indexEl=el}}
                            style={{width: '20%'}}
                            onChange={(values, selectedOptions)=>{this.reindexEl.setState({value: values[1]}); this.hashChanged = true;}}
                            placeholder="Please select index"
                            showSearch={{filter: (inputValue, path)=>path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1) }}
                          />
                          <Input ref={el=>{this.reindexEl=el}} placeholder="rewrite index or index pattern" style={{width: '20%'}}/>
                          <Input.Search
                              style={{width:"50%"}}
                              placeholder="input search keyword"
                              enterButton="execute"     
                              onSearch={this.handleSearchClick}
                          />
                      </Input.Group>
                      </Col>
                      <Col span={4}>
                          <a style={{marginTop:5,display:'block'}} onClick={(e)=>{
                              this.setState((preState)=>{
                                  if(preState.bodyDisplay == 'none') {
                                      return {
                                          bodyDisplay: 'block',
                                      };
                                  }else{
                                      return {
                                          bodyDisplay: 'none'
                                      };
                                  }
                              });
                          }}>{this.state.bodyDisplay == 'none' ? '高级':'收起'}<Icon type="down" /></a>
                      </Col>
                  </Row>
                  <Row style={{display: this.state.bodyDisplay}} gutter={[16, { xs: 8, sm: 16, md: 24, lg: 32 }]}>
                      <Col span={20} style={{border:'1px solid #e8e8e8'}}>
                          {/* <Input.TextArea ref={el=>{this.filterEl=el}} placeholder="input query filter (elasticsearch query DSL)" rows={8}/> */}
                          <Editor
                            height="200px"
                            language="json"
                            theme="light"
                          //  value={`{"match":{"name": "cincky"}}`}
                            options={{
                              minimap: {
                                enabled: false,
                              },
                              tabSize: 2,
                              wordBasedSuggestions: true,
                            }}
                            editorDidMount={this.handleEditorDidMount}
                          />
                      </Col>
                  </Row>
              </Card>
              <div>
                  <Card title={`Index: ${this.props.document.index}`} 
                    bodyStyle={{padding:0, paddingBottom: 24}}
                    extra={this.renderNew()}
                    bordered={false}>
                      <EditableTable doclist={this.props.document} dispatch={this.props.dispatch} 
                      fetchData={(params)=>{this.fetchData(params)}}/>
                    </Card>
              </div>
          </div>
      )
  }
    
}

export default Doucment;