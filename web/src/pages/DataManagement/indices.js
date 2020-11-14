import React, { Component } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect()
class Indices extends Component {
  handleTabChange = key => {
    const { match } = this.props;
    switch (key) {
      case 'summary':
        router.push(`${match.url}/summary`);
        break;
      case 'doc':
        router.push(`${match.url}/doc`);
        break;
      case 'template':
            router.push(`${match.url}/template`);
            break;
      case 'ilm':
        router.push(`${match.url}/ilm`);
        break;
      default:
        break;
    }
  }
  render() {
    const tabList = [
      {
        key: 'summary',
        tab: '索引概览',
      },
      {
        key: 'doc',
        tab: '索引文档管理',
      },
      {
        key: 'template',
        tab: '索引模板管理',
      },
      {
        key: 'ilm',
        tab: '索引生命周期管理',
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
