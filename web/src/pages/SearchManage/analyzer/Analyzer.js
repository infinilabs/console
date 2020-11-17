import React, { Component } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect()
class Analyzer extends Component {
  handleTabChange = key => {
    const { match } = this.props;
    switch (key) {
      case 'manage':
        router.push(`${match.url}/manage`);
        break;
      case 'test':
            router.push(`${match.url}/test`);
            break;
      default:
        break;
    }
  }
  render() {
    const tabList = [
      {
        key: 'manage',
        tab: '分词器管理',
      },
      {
        key: 'test',
        tab: '分词器测试',
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

export default Analyzer;
