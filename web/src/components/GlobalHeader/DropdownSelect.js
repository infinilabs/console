import { Button,  Dropdown, List, Spin, message, Icon } from 'antd';
import React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import styles from './DropdownSelect.less';

class DropdownSelect extends React.Component{
  state={
    value: this.props.defaultValue,
    loading: false,
    hasMore: true,
  }

  handleItemClick = (item)=>{
    let preValue = this.state.value;
    this.setState({
      value: item,
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
  fetchData = ()=>{
    let me = this;
    const {fetchData, size} = this.props;
    let data = this.props.data || [];
    let from = data.length;
    return fetchData(from, size);
  }

  handleInfiniteOnLoad = (page) => {
    let { data } = this.state;
    this.setState({
      loading: true,
    })
    this.fetchData().then((newdata)=>{
      let newState = {
        loading: false,
      };
      if(newdata.length < this.props.size){
        message.info("no more data");
        newState.hasMore = false;
      }
      this.setState(newState);
    });
  }


  render(){
    let me = this;
    const {labelField} = this.props;
    const menu = (<div className={styles.dropmenu} style={{width: this.props.width}}>
      <div className={styles.infiniteContainer} style={{height: this.props.height}}>
        <InfiniteScroll
            initialLoad={false}
            loadMore={this.handleInfiniteOnLoad}
            hasMore={!this.state.loading && this.state.hasMore}
            useWindow={false}
        >
        <List
          grid={{
            gutter: 16,
            sm: 4,
            xs: 3
          }}
          dataSource={this.props.data}
          renderItem={item => (
            <List.Item key={item[labelField]}>
              <Button onClick={()=>{this.handleItemClick(item)}} className={styles.btnitem}>{item[labelField]}</Button>
            </List.Item>
          )}
        >
              {this.state.loading && this.state.hasMore && (
                <div className={styles.loadingContainer}>
                  <Spin />
                </div>
              )}
        </List>
        </InfiniteScroll>
      </div>
      {!this.state.loading && this.state.hasMore && (
        <div style={{textAlign:'center', marginTop: 10, color:'#ccc'}}>
          pull load more
        </div>
      )}
    </div>);
    return(
      this.props.visible ?
          (<Dropdown overlay={menu} placement="bottomLeft">
            <Button className={styles['btn-ds']}>{this.props.value[labelField] || this.state.value[labelField]} <Icon style={{float: 'right', marginTop: 3}}
                                                                          type="caret-down"/></Button>
          </Dropdown>) : ""
    )
  }
  
}

export default DropdownSelect;