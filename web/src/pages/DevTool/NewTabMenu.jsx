import { Button,  Dropdown, List, Spin, message, Icon, Input } from 'antd';
import * as React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import styles from '@/components/GlobalHeader/DropdownSelect.less';
import _ from "lodash";
import {DropdownItem} from '@/components/GlobalHeader/DropdownItem';
import {HealthStatusCircle} from '@/components/infini/health_status_circle'

class NewTabMenu extends React.Component{
  handleItemClick = (item)=>{
    const onItemClick = this.props.onItemClick;
    if(onItemClick && typeof onItemClick == 'function'){
      onItemClick(item)
    }
  }
  constructor(props){
    super(props);
    this.state={
      loading: false,
      hasMore: (props.data || []).length > props.size,
      data: (props.data || []).slice(0, props.size || 10),
      initialLoad: true,
      dataSource: [...props.data],
      dataSourceKey: 1,
    }
  }
  
  componentDidMount(){
  }
  handleInfiniteOnLoad = (current) => {
    let {size } = this.props;
    let targetLength = current * size;
    let {hasMore, dataSource} = this.state;
    if(dataSource.length < targetLength){
      targetLength = dataSource.length;
      hasMore = false
    }
    const newData = this.state.dataSource.slice(0, targetLength);

    this.setState({
      data: newData,
      hasMore: hasMore,
    })
    
  }

  handleInputChange = (e) =>{
    const name = e.target.value;
    const newData = this.props.data.filter(item=>{
      return item.name.includes(name);
    });
    this.setState({
      displayValue: name,
      dataSource: newData,
      data: newData,
      hasMore: newData.length > this.props.size,
    })
   
  }


  render(){
    const {clusterStatus} = this.props;
    return (<div className={styles.dropmenu} style={{width: this.props.width}}>
      <div className={styles.infiniteContainer} style={{height: this.props.height}}>
        <div className={styles.filter} style={{paddingTop: 10, paddingBottom:0}}>
         <input className={styles['btn-ds']} style={{outline:'none'}} onChange={this.handleInputChange} placeholder="输入集群名称查找" value={this.state.displayValue||''} />
        </div>
        <InfiniteScroll
          initialLoad={this.state.initialLoad}
          loadMore={this.handleInfiniteOnLoad}
          hasMore={!this.state.loading && this.state.hasMore}
          useWindow={false}
        >
        <div className={styles.dslist}>
          {(!this.state.data || !this.state.data.length)&& <div style={{display:'flex', justifyContent:'center', alignItems: 'center', height:50}}>匹配不到集群(匹配规则为前缀匹配)</div>}
          {(this.state.data || []).map((item)=>{
            const cstatus = clusterStatus ? clusterStatus[item.id] : null;
            return <DropdownItem key={item.id} 
              clusterItem={item}
              clusterStatus={cstatus}
              onClick={() => {
                this.handleItemClick(item)
              }}
               />
          })}
        </div>
        </InfiniteScroll>
      </div>
      {!this.state.loading && this.state.hasMore && (
        <div style={{textAlign:'center', marginTop: 10, color:'#ccc'}}>
          pull load more
        </div>
      )}
    </div>);
  }
  
}

export default NewTabMenu;