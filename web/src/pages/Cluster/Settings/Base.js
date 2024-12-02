import React, { Component } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect()
class Base extends Component {
  handleTabChange = key => {
    const { match } = this.props;
    switch (key) {
      case 'repository':
        router.push(`${match.url}/repository`);
        break;
      default:
        break;
    }
  }
  render() {
    const tabList = [
      {
        key: 'repository',
        tab: 'repository',
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

export default Base;
