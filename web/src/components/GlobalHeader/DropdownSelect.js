import { Button,  Dropdown, List, Spin, message, Icon, Input } from 'antd';
import React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import styles from './DropdownSelect.less';
import _ from "lodash";
import {DropdownItem} from './DropdownItem';
import {HealthStatusCircle} from '@/components/infini/health_status_circle'

class DropdownSelect extends React.Component{
  state={
    value: this.props.defaultValue,
    loading: false,
    hasMore: true,
    overlayVisible: false,
  }

  handleItemClick = (item)=>{
    let preValue = this.props.value || this.state.value;
    this.setState({
      value: item,
      overlayVisible: false,
    },()=>{
      let onChange = this.props.onChange;
      if(preValue != item && onChange && typeof onChange == 'function'){
        onChange(item)
      }
    })
  }
  
  componentDidMount(){
    let me = this;
    this.fetchData().then((data)=>{
      let hasMore = true;
      if(data.length < this.props.size){
        hasMore = false;
      }
      me.setState({
        hasMore
      })
    })
  }
  fetchData = (name)=>{
    let me = this;
    const {fetchData, size} = this.props;
    let data = this.props.data || [];
    return fetchData(name || '', size);
  }

  handleInfiniteOnLoad = (name) => {
    let { data } = this.props;
    this.setState({
      loading: true,
    })
    this.fetchData(name).then((newdata)=>{
      let newState = {
        loading: false,
      };
      if(newdata.length < this.props.size){
        //message.info("no more data");
        newState.hasMore = false;
      }
      this.setState(newState);
    });
  }

  handleInputChange = (e) =>{
    const name = e.target.value;
    this.setState({
      displayValue: name,
    })
    this.handleInfiniteOnLoad(name);
  }


  render(){
    let me = this;
    const {labelField, clusterStatus} = this.props;
    let value = this.props.value || this.state.value;
    let displayVaue = value[labelField];
    const menu = (<div className={styles.dropmenu} style={{width: this.props.width}}>
      <div className={styles.infiniteContainer} style={{height: this.props.height}}>
        <div className="filter" style={{paddingTop: 10, paddingBottom:0}}>
         <input className={styles['btn-ds']} style={{outline:'none'}} onChange={this.handleInputChange} placeholder="输入集群名称查找" value={this.state.displayValue||''} />
        </div>
        <InfiniteScroll
            initialLoad={false}
            loadMore={this.handleInfiniteOnLoad}
            hasMore={!this.state.loading && this.state.hasMore}
            useWindow={false}
        >
        <div className={styles.dslist}>
          {(!this.props.data || !this.props.data.length)&& <div style={{display:'flex', justifyContent:'center', alignItems: 'center', height:50}}>匹配不到集群(匹配规则为前缀匹配)</div>}
          {(this.props.data || []).map((item)=>{
            // return  <div className={styles.item}>
            //           <Button key={item[labelField]} 
            //           onClick={() => {
            //             this.handleItemClick(item)
            //           }}
            //           className={_.isEqual(item, value) ? styles.btnitem + " " + styles.selected : styles.btnitem}>{item[labelField]}</Button>
            //         </div>
            const cstatus = clusterStatus ? clusterStatus[item.id] : null;
            return <DropdownItem key={item.id} 
              isSelected={item.id===value.id}
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
    const cstatus = clusterStatus ? clusterStatus[value?.id] : null;
    return(
      this.props.visible ?
          (<Dropdown overlay={menu} placement="bottomLeft" visible={this.state.overlayVisible} 
            onVisibleChange={(flag)=>{
              this.setState({ overlayVisible: flag });
            }}>
            {/* <Button className={styles['btn-ds']}>{value[labelField]} <Icon style={{float: 'right', marginTop: 3}}
                                                                          type="caret-down"/></Button> */}
            <span style={{position:'relative'}}>
              <i style={{position: 'absolute', left:15,zIndex:10, top: -28}}>
              {cstatus?.cluster_available ? <HealthStatusCircle status={cstatus?.health_status} />: <Icon type='close-circle' style={{width:14, height:14, color:'red',borderRadius: 14, boxShadow: '0px 0px 5px #555'}} />}
              </i> 
              <input className={styles['btn-ds']} style={{outline:'none', paddingLeft:22}} value={value[labelField]} readOnly={true} />
              <Icon style={{position:'absolute', top:-6, right:-4}} type="caret-down"/>
            </span>
            
          </Dropdown>) : ""
    )
  }
  
}

export default DropdownSelect;