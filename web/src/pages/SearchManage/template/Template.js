import React, { Component } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect()
class Teamplate extends Component {
  handleTabChange = key => {
    const { match } = this.props;
    switch (key) {
      case 'summary':
        router.push(`${match.url}/summary`);
        break;
      case 'template':
        router.push(`${match.url}/template`);
        break;
      case 'param':
            router.push(`${match.url}/param`);
            break;
      case 'history':
        router.push(`${match.url}/history`);
        break;
      default:
        break;
    }
  }
  render() {
    const tabList = [
      {
        key: 'summary',
        tab: '搜索概览',
      },
      {
        key: 'template',
        tab: '模板设置',
      },
      {
        key: 'param',
        tab: '参数管理',
      },
      {
        key: 'history',
        tab: '历史管理',
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

export default Teamplate;
