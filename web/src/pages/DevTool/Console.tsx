import Console from '../../components/kibana/console/components/Console';
import {connect} from 'dva';
import {Button, Icon, Menu, Dropdown, Tabs} from 'antd';
// import Tabs from '@/components/infini/tabs';
import {useState, useReducer, useCallback, useEffect, useMemo, useRef, useLayoutEffect} from 'react';
import {useLocalStorage} from '@/lib/hooks/storage';
import {setClusterID} from '../../components/kibana/console/modules/mappings/mappings';
import {TabTitle} from './console_tab_title';
import '@/assets/utility.scss';
import { Resizable } from "re-resizable";
import {ResizeBar} from '@/components/infini/resize_bar';

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
  panes.push({ key: activeKey, cluster_id: cluster.id, title: cluster.name});
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
      break;
    case 'saveTitle':
      const {key, title} = action.payload;
      const newPanes = state.panes.map((pane: any)=>{
        if(pane.key == key){
          return {
            ...pane,
            title,
          }
        }
        return pane;
      });
      newState = {
        ...state,
        panes: newPanes,
      }
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

function calcHeightToPX(height: string){
  const intHeight = parseInt(height)
  if(height.endsWith('vh')){
    return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) * intHeight / 100;
  }else{
    return intHeight;
  }
}

export const ConsoleUI = ({selectedCluster, 
  clusterList, 
  clusterStatus, 
  minimize=false, 
  onMinimizeClick,
  resizeable=false,
  height='50vh'
}: any)=>{
  const clusterMap = useMemo(()=>{
    let cm = {};
    if(!clusterStatus){
      return cm;
    }
    (clusterList || []).map((cluster: any)=>{
      cluster.status = clusterStatus[cluster.id].health?.status;
      if(!clusterStatus[cluster.id].available){
        cluster.status = 'unavailable';
      }     
      cm[cluster.id] = cluster;
    });
    return cm;
  }, [clusterList, clusterStatus])
  const initialDefaultState = ()=>{
    const defaultActiveKey = `${selectedCluster.id}:${new Date().valueOf()}`;
    const defaultState = selectedCluster? {
      panes:[{
      key: defaultActiveKey, cluster_id: selectedCluster.id, title: selectedCluster.name
      }],
    activeKey: defaultActiveKey,
    }: {panes:[],activeKey:''};
    return defaultState
  }
  
  const [localState, setLocalState, removeLocalState] = useLocalStorage("console:state", initialDefaultState, {
    encode: JSON.stringify,
    decode: JSON.parse,
  })
  const [tabState, dispatch] = useReducer(consoleTabReducer, localState)

  useEffect(()=>{
    if(tabState.panes.length == 0){
      removeLocalState()
      return
    }
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
  
  const rootRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenClick = ()=>{
    if(rootRef.current != null){
      if(!isFullscreen){
        rootRef.current.className = rootRef.current.className + " fullscreen";
        // rootRef.current.style.overflow = 'scroll';
      }else{
        rootRef.current.className = rootRef.current.className.replace(' fullscreen', '');
      }
    }
    setEditorHeight(rootRef.current.clientHeight)
    setIsFullscreen(!isFullscreen)
  }

  const tabBarExtra =(
    <div>
      <Dropdown overlay={menu}>
        <Button size="small" style={{marginRight:5}}>
            <Icon type="plus"/>
        </Button>
      </Dropdown>
      {isFullscreen?
       <Button size="small" onClick={fullscreenClick}>
            <Icon type="fullscreen-exit"/>
        </Button>:
       <Button size="small" onClick={fullscreenClick}>
            <Icon type="fullscreen"/>
        </Button>
      }
      {minimize? <Button size="small" onClick={onMinimizeClick} style={{marginLeft:5}}>
            <Icon type="minus"/>
        </Button>:null}
      </div>
  );

  setClusterID(tabState.activeKey?.split(':')[0]);
  const panes = tabState.panes.filter((pane: any)=>{
    return typeof clusterMap[pane.cluster_id] != 'undefined';
  })

  const saveTitle = (key: string, title: string)=>{
    dispatch({
      type:'saveTitle',
      payload: {
        key,
        title,
      }
    })
  }
  const [editorHeight, setEditorHeight] = useState(calcHeightToPX(height))
  const onResize = (_env, _dir, refToElement, delta)=>{
    // console.log(refToElement.offsetHeight, delta)
    setEditorHeight(refToElement.clientHeight)
  }

  const disableWindowScroll = ()=>{
    document.body.style.overflow = 'hidden'
  }

  const enableWindowScroll = ()=>{
    document.body.style.overflow = '';
  }
  
  
  return (
    <Resizable
    defaultSize={{
      height: editorHeight||'50vh'
    }}
    minHeight={200}
    maxHeight="100vh"
    handleComponent={{ top: <ResizeBar/> }}
    onResize={onResize}
    enable={{
      top: resizeable,
      right: false,
      bottom: false,
      left: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
      topLeft: false,
    }}>
    <div style={{background:'#fff', height:'100%'}}
      onMouseOver={disableWindowScroll}
      onMouseOut={enableWindowScroll}
      id="console"
     ref={rootRef} >
      <Tabs
        onChange={onChange}
        activeKey={tabState.activeKey}
        type="editable-card"
        onEdit={onEdit}
        hideAdd
        tabBarExtraContent={tabBarExtra}
      >
        {panes.map(pane => (
          <TabPane tab={<TabTitle title={pane.title} onTitleChange={(title)=>{saveTitle(pane.key, title)}}/>} key={pane.key} closable={pane.closable}>
            <TabConsole height={editorHeight - 40} selectedCluster={clusterMap[pane.cluster_id]} paneKey={pane.key} saveEditorContent={saveEditorContent} initialText={pane.content} />
            {/*  {pane.content} */}
          </TabPane>
        ))}
      </Tabs>
    </div>
  </Resizable>
  );
}

export default connect(({
  global
})=>({
  selectedCluster: global.selectedCluster,
  clusterList: global.clusterList,
  clusterStatus: global.clusterStatus,
  height: window.innerHeight - 75 + 'px',
}))(ConsoleUI);