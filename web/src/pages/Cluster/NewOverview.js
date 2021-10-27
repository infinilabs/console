import * as React from 'react';
import {Tabs} from 'antd';
import Clusters from './components/clusters';
const {TabPane} = Tabs;


const panes = [
  { title: 'Clusters', component: Clusters, key: 'clusters' },
  { title: 'Hosts', component: 'Content of Tab 2', key: 'hosts' },
  {title: 'Nodes', component: 'Content of Tab 3',key: 'nodes'},
  {title: 'Indices', component: 'Content of Tab 3',key: 'indices'},
];

const NewOverview = ()=>{
  
  return (<div style={{background:'#fff'}} className="overview">
    <div>
    <Tabs
      onChange={()=>{}}
      type="card"
      tabBarGutter={10}
      >
        {panes.map(pane => (
          <TabPane tab={pane.title} key={pane.key}>
            {typeof pane.component == 'string'? pane.component: <pane.component/>}
          </TabPane>
        ))}
      </Tabs>
    </div>
  </div>);
}

export default NewOverview;