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
      case 'param':
            router.push(`${match.url}/param`);
            break;
      case 'rule':
        router.push(`${match.url}/rule`);
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
      },
      {
        key: 'param',
        tab: '字段别名管理',
      },
      {
        key: 'rule',
        tab: 'index pattern 对应规则',
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
