import React, { Component } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect()
class Dict extends Component {
  handleTabChange = key => {
    const { match } = this.props;
    switch (key) {
      case 'professional':
        router.push(`${match.url}/professional`);
        break;
      case 'common':
            router.push(`${match.url}/common`);
            break;
      default:
        break;
    }
  }
  render() {
    const tabList = [
      {
        key: 'professional',
        tab: '专业词典管理',
      },
      {
        key: 'common',
        tab: '常用词管理',
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

export default Dict;
