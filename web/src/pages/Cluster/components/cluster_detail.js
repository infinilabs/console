import {Tabs} from 'antd';
import {Metrics} from './detail';

const {TabPane} = Tabs;

const panes = [
  { title: 'Metrics', component: Metrics, key: 'metrics' },
  { title: 'Infos', component: 'Content of Tab 2', key: 'infos' },
  {title: 'Activities', component: 'Content of Tab 3',key: 'activities'},
  {title: 'Console', component: 'Content of Tab 3',key: 'console'},
];

const ClusterDetail = ()=>{
  return (
    <div>
      <Tabs
      onChange={()=>{}}
      type="card"
      tabBarGutter={10}
      tabPosition="right"
      >
        {panes.map(pane => (
          <TabPane tab={pane.title} key={pane.key}>
            {typeof pane.component == 'string'? pane.component: <pane.component/>}
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
}

export default ClusterDetail;