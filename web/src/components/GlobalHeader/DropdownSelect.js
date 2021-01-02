import { Button,  Dropdown, List, Spin, message, Icon } from 'antd';
import React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import styles from './DropdownSelect.less';

class DropdownSelect extends React.Component{
  state={
    value: this.props.defaultValue,
    data: this.props.data || [],
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
    let data = [];
    for(let i = 1; i<=28; i++){
      data.push('cluster'+i)
    }
    this.setState({
      data: data,
    })
  }
  fetchData = ()=>{
    let me = this;
    return new Promise(resolve => {
      setTimeout(() => {
        let start = me.state.data.length;
        let data =[]
        for(let i = start + 1; i<start+11; i++){
          data.push('cluster'+i)
        }
        resolve(data)
      }, 2000)
    });
  }

  handleInfiniteOnLoad = (page) => {
    let { data } = this.state;
    this.setState({
      loading: true,
    })
    if (data.length > 50) {  
       message.warning('No more data');
      this.setState({
        hasMore: false,
        loading: false,
      });
      return;
    }
    this.fetchData().then((newdata)=>{
      data = data.concat(newdata);
      this.setState({
        data,
        loading: false,
      });
    });
  }


  render(){
    let me = this;
    const menu = (<div className={styles.dropmenu}>
      <div className={styles.infiniteContainer}>
        <InfiniteScroll
            initialLoad={false}
            loadMore={this.handleInfiniteOnLoad}
            hasMore={!this.state.loading && this.state.hasMore}
            useWindow={false}
        >
        <List
          grid={{
            gutter: 8,
            column: 4,
          }}
          dataSource={this.state.data}
          renderItem={item => (
            <List.Item key={item}>
              <Button onClick={()=>{this.handleItemClick(item)}} className={styles.btnitem}>{item}</Button>
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
      <Dropdown overlay={menu} placement="bottomLeft">
        <Button className={styles['btn-ds']}>{this.state.value} <Icon style={{float:'right', marginTop:3}} type="caret-down"/></Button>
      </Dropdown>
    )
  }
  
}

export default DropdownSelect;