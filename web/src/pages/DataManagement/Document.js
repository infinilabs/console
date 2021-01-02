import React from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
import router from 'umi/router';
import { connect } from 'dva';
import { Col, Form, Row,Select, Input, Card,Icon, Table, InputNumber, Popconfirm,
   Divider,Button,Tooltip, Modal, DatePicker, message } from 'antd';
import Editor, {monaco} from '@monaco-editor/react';
import moment from 'moment';
import {createDependencyProposals} from './autocomplete';
import InputSelect from '@/components/infini/InputSelect';

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

// monaco.config({
//   paths: {
//     vs: '...',
//   },
//   'vs/nls' : {
//     availableLanguages: {
//       '*': 'de',
//     },
//   },
// });
monaco.init().then((mi)=>{
  mi.languages.onLanguage("json", ()=>{
    mi.languages.registerCompletionItemProvider('json', {
      triggerCharacters: ['"'],
      provideCompletionItems: function(model, position, ctx) { 
          var textUntilPosition = model.getValueInRange({startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column});
          
          if(textUntilPosition.indexOf('{') < 0){
            return { suggestions: [] };
          }
          
          let key = findParentIdentifier(textUntilPosition);
          var word = model.getWordUntilPosition(position);
          
          var range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
          };
          
          //console.log(ctx, range,textUntilPosition)
          return {
              suggestions: createDependencyProposals(key, range, mi, ctx.triggerCharacter)
          };
      }
    });
  })

})

const {Option} = Select;

const EditableContext = React.createContext();

class EditableCell extends React.Component {
    getInput = () => {
      let {record, dataIndex, type} = this.props;
      if(['byte','short', 'integer', 'long'].includes(type)){
        return  <InputNumber />;
      }else if(type == 'date'){
        return <DatePicker showTime/>
      }
      // if (typeof record[dataIndex] === 'number') {
      //   return <InputNumber />;
      // }
      return <Input/>;
    };
  
    renderCell = ({ getFieldDecorator }) => {
      const {
        editing,
        dataIndex,
        title,
        record,
        index,
        children,
        type,
        ...restProps
      } = this.props;
      let initialValue = '';
      if(editing){
        if(type=='date'){
          initialValue = record[dataIndex] && moment(record[dataIndex]);
        }else{
          initialValue = record[dataIndex];
        }
      }
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
                initialValue: initialValue,
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
                    {formatMessage({id:'form.save'})}
                  </a>
                )}
              </EditableContext.Consumer>
              <Popconfirm title="Sure to cancel?" onConfirm={() => this.cancel(record.id)}>
                <a>{formatMessage({id:'form.button.cancel'})}</a>
              </Popconfirm>
            </span>
          ) : (<div>
            <a disabled={editingKey !== ''} onClick={() => this.edit(record)}>
              {formatMessage({id:'form.button.edit'})}
            </a>
            <Divider type="vertical"/>
              <Popconfirm title="Sure to delete?" onConfirm={() => this.delete(record)}>
                <a>{formatMessage({id:'form.button.delete'})}</a>
              </Popconfirm>
           </div>
          );
        },
      };
    }
  
    isEditing = record => record.id === this.props.doclist.editingKey;

    getFieldType = (record, key)=>{
      const {doclist} = this.props;
      // if(!doclist.mappings[record._index]){
      //   console.log(record, doclist.mappings)
      //   return
      // }
      const {properties} = doclist.mappings[record._index].mappings;
      return properties[key].type;
    }
  
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

    handleTableChange = (pagination, filters, sorter) =>{
      //console.log(pagination, filters, sorter);
  
      const {fetchData, doclist} = this.props;
      fetchData({
        pageIndex: pagination.current,
        pageSize: pagination.pageSize,
        index: doclist.index,
        cluster: doclist.cluster,
        filter: doclist.filter,
        sort: (sorter.order && sorter.field) || '',
        sort_direction: sorter.order == 'ascend' ? 'asc' : 'desc'
      })
    }
    
    isSortable = (type) => {
      return ['keyword', 'date', 'long', 'integer', 'short', 'byte', 'double', 'float', 'scaled_float'].includes(type)
    }

    render() {
      let {doclist} = this.props;
      let columns = [];
      let keys = [];
      let sortObj = {};
      if(doclist.mappings){
        for(let mkey in doclist.mappings){
          Object.keys(doclist.mappings[mkey].mappings.properties).forEach(key=>{
            if(!keys.includes(key)){
              keys.push(key);
              sortObj[key] = this.isSortable(doclist.mappings[mkey].mappings.properties[key].type);
            }
          })
        }
      }
      for(let key of keys){
        if(["_index"].includes(key)){
          continue;
        }
        let col = {
          title: key,
          dataIndex: key,
          ellipsis: true,
          sorter: sortObj[key],
          render: (text)=>(<Tooltip placement="top" title={text}>{text}</Tooltip>),
          onCell: record => ({
            record,
            dataIndex: key,
            title: key,
            editing: this.isEditing(record),
            type: this.getFieldType(record, key),
            // onMouseEnter: event => {console.log(event)}, 
            // onMouseLeave: event => {},
          }),
        }
        if(["id"].includes(key)){
          col.onCell = "";
        }
        columns.push(col)
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
            onChange={this.handleTableChange}
            size="small"
            loading={doclist.isLoading}
            dataSource={doclist.data}
            columns={columns}
            rowClassName="editable-row"
            pagination={{
              showSizeChanger: true,
              total: doclist.total?  doclist.total.value: 0,
              pageSize: doclist.pageSize,
              current: doclist.pageIndex,
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
    const {location, dispatch } = this.props;
    //console.log(match, location);
    let index = location.query.index;
    let cluster = location.query.cluster || 'single-es';
    if(!cluster){
      return
    }
    dispatch({
      type: 'document/fetchIndices',
      payload: {
        cluster,
      }
    }).then(()=>{
      if(!index){
        return
      }
      this.fetchData({
        pageSize: 10,
        pageIndex: 1,
        cluster,
        index,
      })
    })
   
  }
  
  handleNewClick = ()=>{
    const {dispatch, document} = this.props;
    if(document.isAddNew){ //!document.data || document.data.length == 0 
      return;
    }
    let {indices, mappings} = document;
    let _index = indices[0];
    if(indices && indices.length > 1){
      //console.log(this.indexSelEl);
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
    let properties = mappings[_index].mappings.properties;
    let keys = Object.keys(properties)
    let newDoc = {id:"", _index};
    for(let key of keys){
      if(properties[key].type == 'date'){
        newDoc[key] = null
      }else{
        newDoc[key] = ""
      }
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

  handleSearchClick = (e)=>{
    let value = this.keywordEl.state.value;
    let index = this.indexEl.state.value;
    let cluster = this.clusterEl.rcSelect.state.value[0];
    let filter = '';
    if(!cluster || !index){
      message.error('please select cluster and index');
      return;
    }
    if(this.state.bodyDisplay != 'none'){
      filter = this.filterGetter();
    }
    this.fetchData({
      cluster,
      index,
      pageSize: this.props.document.pageSize,
      pageIndex: 1,
      //filter: this.filterEl.state.value,
      filter,
      keyword: value,
    }).then(()=>{
      if(this.hashChanged){
        router.push(`/data/doc?cluster=${cluster}&index=${index}`);
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
        <Button type="primary" icon="plus" onClick={this.handleNewClick}>{formatMessage({ id: 'form.button.new' })}</Button>
      </div>
    )
  }

  render(){
      // const {getFieldDecorator} = this.props.form;
      //console.log(this.props.document);
      let clusterIndices = this.props.document.clusterIndices || [];
     
      clusterIndices = clusterIndices.map((index) =>{
        return {
          label: index,
          value: index,
        };
      })
      const clusters = ["single-es"];
      let {cluster, index}= this.props.document;
      cluster = cluster || this.props.location.query.cluster || 'single-es';
      index = index || this.props.location.query.index;
      return (
          <div>
              <Card>
                  <Row gutter={[16, { xs: 8, sm: 16, md: 24, lg: 32 }]}>
                      <Col span={20} style={{paddingLeft:0}}>
                      <Input.Group compact>
                         <Select ref={el=>this.clusterEl=el} defaultValue={cluster} style={{width: '20%'}}>
                            {
                              clusters.map(op=>(<Select.Option value={op} key={op}>{op}</Select.Option>))
                            }
                          </Select>
                          <InputSelect data={clusterIndices} onChange={()=>{this.hashChanged=true;}} defaultValue={index} ref={el=>{this.indexEl=el}} placeholder="input index or index pattern" style={{width: '25%'}}/>
                          <Input
                              style={{width:"40%"}}
                              ref={el=>this.keywordEl=el}
                              placeholder="input search keyword"    
                              disabled = {this.state.bodyDisplay != 'none'}
                          />
                          <Button type="primary" onClick={this.handleSearchClick}>{formatMessage({ id: 'form.button.search' })}</Button>
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
                          }}>{this.state.bodyDisplay == 'none' ? formatMessage({id:'form.button.advanced'}): formatMessage({id:'form.button.collapse'})}<Icon type="down" /></a>
                      </Col>
                  </Row>
                  <Row style={{display: this.state.bodyDisplay}} gutter={[16, { xs: 8, sm: 16, md: 24, lg: 32 }]}>
                      <Col span={16} style={{border:'1px solid #e8e8e8'}}>
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
                      <Col span={8}>
                        <div style={{fontSize: 12, paddingLeft: 20}}>
                          <div style={{fontSize: 16, paddingBottom: 10, color: '#1890FF'}}>query example:</div>
                          <div style={{background:'rgb(245, 247, 250)', padding: 10}}>
                            <pre className="language-json">{JSON.stringify({
                              must: {
                                match: {
                                  FIELD: "VALUE"
                                }
                              }
                            }, null, 2)}</pre>
                          </div>
                        </div>
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