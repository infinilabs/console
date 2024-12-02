import React, { Component } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect()
class NLP extends Component {
  handleTabChange = key => {
    const { match } = this.props;
    switch (key) {
        case 'query':
        router.push(`${match.url}/query`);
        break;
        case 'intention':
            router.push(`${match.url}/intention`);
            break;
        case 'knowledge':
            router.push(`${match.url}/knowledge`);
            break;
        case 'text':
            router.push(`${match.url}/text`);
            break;
      default:
        break;
    }
  }
  render() {
    const tabList = [
      {
        key: 'query',
        tab: '查询语义识别',
      },
      {
        key: 'intention',
        tab: '意图识别设置',
      },
      {
        key: 'knowledge',
        tab: '知识图谱管理',
      },
      {
        key: 'text',
        tab: '文本聚类管理',
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

export default NLP;
