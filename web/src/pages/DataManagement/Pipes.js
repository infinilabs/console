import React, { Component } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect()
class Pipes extends Component {
  handleTabChange = key => {
    const { match } = this.props;
    switch (key) {
      case 'logstash':
        router.push(`${match.url}/logstash`);
        break;
      case 'ingestpipeline':
        router.push(`${match.url}/ingestpipeline`);
        break;
      default:
        break;
    }
  }
  render() {
    const tabList = [
      {
        key: 'logstash',
        tab: 'Logstash 配置管理',
      },
      {
        key: 'ingestpipeline',
        tab: 'Elasticsearch Ingest Pipeline 管理',
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

export default Pipes;
