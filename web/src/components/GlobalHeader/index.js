import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import Link from 'umi/link';
import Debounce from 'lodash-decorators/debounce';
import styles from './index.less';
import RightContent from './RightContent';
import DropdownSelect from './DropdownSelect'

export default class GlobalHeader extends PureComponent {
  componentWillUnmount() {
    this.triggerResizeEvent.cancel();
  }
  /* eslint-disable*/
  @Debounce(600)
  triggerResizeEvent() {
    // eslint-disable-line
    const event = document.createEvent('HTMLEvents');
    event.initEvent('resize', true, false);
    window.dispatchEvent(event);
  }
  toggle = () => {
    const { collapsed, onCollapse } = this.props;
    onCollapse(!collapsed);
    this.triggerResizeEvent();
  };
  render() {
    const { collapsed, isMobile, logo, clusterVisible, clusterList, selectedCluster } = this.props;
    return (
      <div className={styles.header}>
        {isMobile && (
          <Link to="/" className={styles.logo} key="logo">
            <img src={logo} alt="logo" width="32" />
          </Link>
        )}
        <Icon
          className={styles.trigger}
          type={collapsed ? 'menu-unfold' : 'menu-fold'}
          onClick={this.toggle}
        />
        <DropdownSelect defaultValue={selectedCluster}
          value={selectedCluster}
          labelField="name"
          visible={clusterVisible}
          onChange={(item)=>{
            this.props.handleSaveGlobalState({
              selectedCluster: item
            })
          }}
          size={56}
           fetchData={
             this.props.onFetchClusterList
          //   (from, size)=>{
          //   return new Promise(resolve => {
          //     setTimeout(() => {
          //       let start = from;
          //       let data =[]
          //       for(let i = start + 1; i<start+size+1; i++){
          //         if(start+size > 56){
          //           break;
          //         }
          //         data.push('cluster'+i)
          //       }
          //       resolve(data)
          //     }, 2000)
          //   });
          // }
          }
        data={clusterList}/>
        <RightContent {...this.props} />
      </div>
    );
  }
}
