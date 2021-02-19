import React, { Component } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect()
class Backup extends Component {
  handleTabChange = key => {
    const { match } = this.props;
    switch (key) {
      case 'bakandrestore':
        router.push(`${match.url}/bakandrestore`);
        break;
      case 'bakcycle':
        router.push(`${match.url}/bakcycle`);
        break;
      default:
        break;
    }
  }
  render() {
    const tabList = [
      {
        key: 'bakandrestore',
        tab: '索引备份与还原',
      },
      {
        key: 'bakcycle',
        tab: '备份周期管理',
      }
    ];

    const { match, children, location } = this.props;

    return (
      <PageHeaderWrapper
        tabList={tabList}
        tabActiveKey={location.pathname.replace(`${match.path}/`, '')}
        onTabChange={this.handleTabChange}
      >
        {children}
      </PageHeaderWrapper>
    );
  }
}

export default Backup;
