import Console from '../../components/kibana/console/components/Console';
import {connect} from 'dva';
import {Tabs, Button, Icon, Menu, Dropdown} from 'antd';
import {useState, useReducer, useCallback, useEffect, useMemo} from 'react';
import {useLocalStorage} from '@/lib/hooks/storage';
import {setClusterID} from '../../components/kibana/console/modules/mappings/mappings';
import {editorList} from '@/components/kibana/console/contexts/editor_context/editor_registry';

const { TabPane } = Tabs;

const TabConsole = (props:any)=>{
  return (
    <Console {...props}/>
  )
}


// export default connect(({
//   global
// })=>({
//   selectedCluster: global.selectedCluster,
// }))(Console);

const addTab = (state: any, action: any) => {
  const { panes } = state;
  const {cluster} = action.payload;
  const activeKey = `${cluster.id}:${new Date().valueOf()}`;
  panes.push({ key: activeKey, cluster_id: cluster.id});
  return {
    ...state,
    panes,
    activeKey,
  }
}
const removeTab = (state: any, action: any) =>{
  const { activeKey, panes } = state;
  const {targetKey} = action.payload;
  const newPanes = panes.filter(pane => pane.key !== targetKey);
  return {
    ...state,
    panes: newPanes,
    activeKey: panes[0]?.key,
  }
}

const consoleTabReducer = (state: any, action: any) => {
  const {type, payload} = action;
  let newState = state;
  switch(type){
    case 'add':
      newState = addTab(state, action);
      break;
     case 'remove':
      newState =  removeTab(state, action);
      break;
    case 'change':
      newState = {
        ...state,
        activeKey: payload.activeKey,
      }
      editorList.setActiveEditor(payload.activeKey);
      break;
    case 'saveContent':
      const panes = state.panes.map((pane)=>{
        if(pane.key == state.activeKey){
          return {
            ...pane,
            content: action.payload.content,
          }
        }
        return pane;
      });
      newState = ({
        ...state,
        panes,
      });
      break;
    default:
  }
  // setLocalState(newState);
  return newState;
}

const ConsoleUI = ({clusterList}: any)=>{
  const clusterMap = useMemo(()=>{
    let cm = {};
    (clusterList || []).map((cluster: any)=>{
        cm[cluster.id] = cluster;
    });
    return cm;
  }, [clusterList])
  const [localState, setLocalState, removeLocalState] = useLocalStorage("console:state", {
    panes: [],
    activeKey: '',
  },{
    encode: JSON.stringify,
    decode: JSON.parse,
  })
  const [tabState, dispatch] = useReducer(consoleTabReducer, localState)

  useEffect(()=>{
    setLocalState(tabState)
  }, [tabState])

  const saveEditorContent = useCallback((content)=>{
    dispatch({
      type: 'saveContent',
      payload: {
        content
      }
    })
  }, [dispatch])

  const onChange = (activeKey:string) => {
    dispatch({
      type: 'change',
      payload: {
        activeKey
      }
    })
  };

  const onEdit = (targetKey: string | React.MouseEvent<HTMLElement, MouseEvent>, action:string) => {
    dispatch({
      type: action,
      payload: {
        targetKey,
      }
    })
  };

  const newTabClick = useCallback((param: any)=>{
    const cluster = clusterList.find(item=>item.id == param.key);
    if(!cluster){
      console.log('cluster not found')
      return;
    }
    dispatch({
      type:'add',
      payload: {
        cluster,
      }
    })
  },[clusterList])

  const menu = (
    <Menu onClick={newTabClick}>
      {(clusterList||[]).map((cluster:any)=>{
        return <Menu.Item key={cluster.id}>{cluster.name}</Menu.Item>
      })}
    </Menu>
  );

  const tabBarExtra =(<Dropdown overlay={menu}>
    <Button size="small">
         <Icon type="plus"/>
        </Button>
  </Dropdown>);

  setClusterID(tabState.activeKey?.split(':')[0]);
  const panes = tabState.panes.filter((pane: any)=>{
    return typeof clusterMap[pane.cluster_id] != 'undefined';
  })

  return (
    <div style={{background:'#fff'}}>
      <Tabs
        onChange={onChange}
        activeKey={tabState.activeKey}
        type="editable-card"
        onEdit={onEdit}
        hideAdd
        tabBarExtraContent={tabBarExtra}
      >
        {panes.map(pane => (
          <TabPane tab={clusterMap[pane.cluster_id].name} key={pane.key} closable={pane.closable}>
            <TabConsole selectedCluster={clusterMap[pane.cluster_id]} paneKey={pane.key} saveEditorContent={saveEditorContent} initialText={pane.content} />
            {/*  {pane.content} */}
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
}

export default connect(({
  global
})=>({
  selectedCluster: global.selectedCluster,
  clusterList: global.clusterList,
}))(ConsoleUI);