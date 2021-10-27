import { Input, Icon, List, Card,Button } from 'antd';
import * as React from 'react';
import './clusters.scss';
import ClusterDetail from './cluster_detail';
import {TagList} from './tag';
import ClusterCard from './cluster_card';

const { Search } = Input;

const Clusters = ()=>{
  const [collapse, setCollapse] = React.useState(false);
  const toggleCollapse = ()=>{
    setCollapse(!collapse)
  }
  const clusterList = [1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <div className="clusters">
      <div className="wrapper">
        <div className={"col left" + (collapse ? " collapse": "")}>
          <div className="search-line">
            <div className="search-box">
              <Search
                placeholder="search"
                enterButton="Search"
                onSearch={value => console.log(value)}
              />
            </div>
            <div className="help">
              <Button type="link">Get help?</Button>
            </div>
          </div>
          <div className="tag-line">
            <TagList value={[{text:"Dev"}, {text:'7.9.2', checked: true}, {text:"Prod"}, {text:"QA"}, {text:"Metrics"}]} />
          </div>
          <div className="card-cnt">
            <List itemLayout="vertical"
            size="small"
            bordered={false}
            pagination={{
              onChange: page => {
                console.log(page);
              },
              showSizeChanger: true,
              pageSizeOptions: ['5','10','20'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              pageSize: 5,
            }}
            dataSource={clusterList}
            renderItem={(item)=>(
              <List.Item>
               {/* <Card>
                   <p>Card content</p>
               </Card> */}
               <ClusterCard/>
             </List.Item>
            )}
            />     
          </div>
        </div>
        <div className="collapse" >
          <span className="area" onClick={toggleCollapse}>
            <Icon type={collapse ? "right": "left"} className="icon"/>
          </span>  
          </div>
       <div className="col right">
        <ClusterDetail/>
       </div>
      </div>
    </div>
  )
}

export default Clusters;