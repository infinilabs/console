import {EuiIcon} from '@elastic/eui';
import { DocViewer } from '../../doc_viewer/doc_viewer';
import {Drawer, Button, Menu,Dropdown, Icon, Popconfirm, message,Descriptions, Popover, Input} from 'antd';
import Editor from "@monaco-editor/react";
import {useState, useRef} from 'react';

function generateNewID(id: string) {
 return id.slice(0, 14) + Math.random().toString(36).substr(2, 6)
}



interface Props {
  columns: string[];
  indexPattern: any;
  row: any;
  onFilter: (field: any, values: any, operation: any) => void;
  onAddColumn?: (name: string) => void;
  onRemoveColumn?: (name: string) => void;
  document: any;
}

export function Detail({
  columns,
  indexPattern,
  row,
  onFilter,
  onAddColumn,
  onRemoveColumn,
  document,
}:Props){
  const [editorVisible, setEditorVisble] = useState(false);
  const editorRef = useRef(null);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor; 
  }

  const editDocumentClick = ()=>{
    setEditorVisble(true)
  }
  const editCancelClick = ()=>{
    setEditorVisble(false)
  }
  const saveDocumentClick = async (docID?: string)=>{
    const value = editorRef.current?.getValue();
    let source = {}
    try {
      source = JSON.parse(value)
    } catch (error) {
      message.error('wrong json format')
      return
    }
    let params = {
      _index: row._index,
      _id: docID || row._id,
      _type: row._type,
      _source: source,
    };
    
    docID && (params['is_new'] = '1')
    const res = await document.saveDocument(params)
    if(!res.error) setEditorVisble(false)
  }
  const deleteDocumentClick = ()=>{
    document.deleteDocument({
      _index: row._index,
      _id: row._id,
      _type: row._type,
    })
  }

  const menu = (
    <Menu>
      <Menu.Item key="Edit" onClick={editDocumentClick}>
        <a> Edit </a>
      </Menu.Item>
      <Menu.Item key="Delete">
        <Popconfirm title="sure to delete" onConfirm={()=>{
          deleteDocumentClick();
        }}><a> Delete </a></Popconfirm>
      </Menu.Item>
    </Menu>
  );

  return (
    <td colSpan={ columns.length + 2 }>
  <div className="euiFlexGroup euiFlexGroup--gutterLarge euiFlexGroup--directionRow euiFlexGroup--justifyContentSpaceBetween">
    <div className="euiFlexItem euiFlexItem--flexGrowZero euiText euiText--small">
      <div className="euiFlexGroup euiFlexGroup--gutterSmall euiFlexGroup--directionRow">
        <div className="euiFlexItem euiFlexItem--flexGrowZero">
          <EuiIcon type="folderOpen" size="m" style={{marginTop: 5}}/>
        </div>
        <div className="euiFlexItem euiFlexItem--flexGrowZero">
          <h4
            data-test-subj="docTableRowDetailsTitle"
            className="euiTitle euiTitle--xsmall"
          >Expanded document</h4>
        </div>
      </div>
    </div>
    <div className="euiFlexItem euiFlexItem--flexGrowZero euiText euiText--small">
      <div className="euiFlexGroup euiFlexGroup--gutterLarge euiFlexGroup--directionRow">
        <Drawer title="Edit document" visible={editorVisible} width="640" destroyOnClose={true} 
          onClose={()=>{setEditorVisble(false)}}>
         <Descriptions>
          <Descriptions.Item label="_index">{row._index}</Descriptions.Item>
          <Descriptions.Item label="_id">{row._id}</Descriptions.Item>
        </Descriptions>
          <Editor
          height="70vh"
          theme="vs-light"
          language="json"
          options={{
            minimap: {
              enabled: false,
            },
            tabSize: 2,
            wordBasedSuggestions: true,
          }}
          value={JSON.stringify(row._source, null, 2)}
          onMount={handleEditorDidMount}
          />
          <div style={{display:'flex',  height: '10vh', alignItems:'center', justifyContent:'center'}}>
            <div style={{marginLeft:'auto'}} >
              <Button onClick={editCancelClick} style={{marginRight:5}}>Cancel</Button>
              {/* <Button type="primary" onClick={()=>{}} style={{marginRight:5}}>Save as New</Button> */}
              <SaveAsNewButton docID={row._id} saveDocumentClick={saveDocumentClick}/>
              <Button type="primary" onClick={()=>{saveDocumentClick()}} >Save</Button>
            </div>
          </div>
        </Drawer>
        <div className="euiFlexItem euiFlexItem--flexGrowZero euiText euiText--small">
          {/* <a
            className="euiLink"
            onClick={()=>{setEditorVisble(true)}}
          >Edit document</a> */}
          <Dropdown overlay={menu} >
          <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
            Operation <Icon type="down" />
          </a>
        </Dropdown>
        </div>
        {/* <div className="euiFlexItem euiFlexItem--flexGrowZero euiText euiText--small">
          <a
            className="euiLink"
          >View surrounding documents</a>
        </div>
        <div className="euiFlexItem euiFlexItem--flexGrowZero euiText euiText--small">
          <a
            className="euiLink"
          >View single document</a>
        </div> */}
      </div>
    </div>
  </div>
  <div data-test-subj="docViewer">
    <DocViewer
      columns={columns}
      filter={onFilter}
      hit={row}
      indexPattern={indexPattern}
      onAddColumn={onAddColumn}
      onRemoveColumn={onRemoveColumn}   
    />
  </div>

</td>

  )
}

const SaveAsNewButton = ({docID, saveDocumentClick}:any)=>{
  const newID = generateNewID(docID);
  const [newDocID, setNewDocID] = useState(newID)
  const content = (<div style={{width: 200}}>
    <div><Input value={newDocID} onChange={(e)=>{
      setNewDocID(e.target.value)
    }} /></div>
    <div style={{marginTop:10}}><Button onClick={()=>{
      saveDocumentClick(newDocID)
    }}>确定</Button></div>
  </div>)
  return (
    <Popover
    content={content}
    title="Please input new ID"
    trigger="click"
    // visible={this.state.visible}
    // onVisibleChange={this.handleVisibleChange}
  >
    <Button  style={{marginRight:5}} type="primary">Save as new</Button>
  </Popover>
  )
}