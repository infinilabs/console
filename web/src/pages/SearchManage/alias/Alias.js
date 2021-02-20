import React, { Component } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect()
class Indices extends Component {
  handleTabChange = key => {
    const { match } = this.props;
    switch (key) {
      case 'index':
        router.push(`${match.url}/index`);
        break;
      default:
        break;
    }
  }
  render() {
    const tabList = [
      {
        key: 'index',
        tab: '索引别名管理',
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

export default Indices;
