import React, { Component,Fragment,useState, useEffect } from 'react';
import { connect } from 'dva';
import { Card, Select,Button,Table,Row,Col } from 'antd';
import { formatMessage, FormattedMessage } from 'umi/locale';
import DescriptionList from '@/components/DescriptionList';
const { Description } = DescriptionList;

import { Pie,Line } from '@ant-design/charts';

    const piedata =[
        {
          health: 'green',
          value: 27,
        },
        {
          health: 'yellow',
          value: 25,
        },
        {
          health: 'red',
          value: 18,
        }
      ];
      const config = {
        appendPadding: 10,
        data: piedata,
        angleField: 'value',
        colorField: 'health',
        color: (field) => {
          return field.health;
       },
       height: 300,
        radius: 1,
        innerRadius: 0.56,
        label: {
          type: 'inner',
          offset: -25,
          autoRotate: false,
          content: '{value}',
          style: {
            fill: '#333',
            stroke: '#fff',
            strokeWidth: 1,
            fontSize: 24,
          },
        },
        interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
        statistic: {
          title: {
            offsetY: -20,
            style: { fontSize: 44 },
            formatter: function formatter(datum) {
              return datum ? datum.type : '总计';
            },
          },
          content: {
            offsetY: 30,
            style: { fontSize: 44 },
            formatter: function(datum, data) {
              return datum
                ? ' '.concat(datum.value)
                : ' '.concat(
                    data.reduce(function (r, d) {
                      return r + d.value;
                    }, 0),
                  );
            },
          },
        },
      };
      const shardData =[
        {
          shard: 'pri',
          value: 27,
        },
        {
          shard: 'rep',
          value: 54,
        }
      ];
      const shardConfig = {
        appendPadding: 10,
        data: shardData,
        angleField: 'value',
        colorField: 'shard',
       height: 300,
        radius: 1,
        innerRadius: 0.56,
        label: {
          type: 'inner',
          offset: -25,
          autoRotate: false,
          content: '{value}',
          style: {
            fill: '#333',
            stroke: '#fff',
            strokeWidth: 1,
            fontSize: 24,
          },
        },
        interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
        statistic: {
          title: {
            offsetY: -20,
            style: { fontSize: 44 },
            formatter: function formatter(datum) {
              return datum ? datum.type : '总计';
            },
          },
          content: {
            offsetY: 30,
            style: { fontSize: 44 },
            formatter: function(datum, data) {
              return datum
                ? ' '.concat(datum.value)
                : ' '.concat(
                    data.reduce(function (r, d) {
                      return r + d.value;
                    }, 0),
                  );
            },
          },
        },
      };
const datasource = `[{"health":"green","status":"open","index":"blogs_fixed","uuid":"Q6zngGf9QVaWqpV0lF-0nw","pri":"1","rep":"1","docs.count":"1594","docs.deleted":"594","store.size":"17.9mb","pri.store.size":"8.9mb"},{"health":"red","status":"open","index":"elastic_qa","uuid":"_qkVlQ5LRoOKffV-nFj8Uw","pri":"1","rep":"1","docs.count":null,"docs.deleted":null,"store.size":null,"pri.store.size":null},{"health":"green","status":"open","index":".kibana-event-log-7.9.0-000001","uuid":"fgTtyl62Tc6F1ddJfPwqHA","pri":"1","rep":"1","docs.count":"20","docs.deleted":"0","store.size":"25kb","pri.store.size":"12.5kb"},{"health":"green","status":"open","index":"blogs","uuid":"Mb2n4wnNQSKqSToI_QO0Yg","pri":"1","rep":"1","docs.count":"1594","docs.deleted":"0","store.size":"11mb","pri.store.size":"5.5mb"},{"health":"green","status":"open","index":".kibana-event-log-7.9.0-000002","uuid":"8GpbwnDXR2KJUsw6srLnWw","pri":"1","rep":"1","docs.count":"9","docs.deleted":"0","store.size":"96.9kb","pri.store.size":"48.4kb"},{"health":"green","status":"open","index":".apm-agent-configuration","uuid":"vIaV9k2VS-W48oUOe2xNWA","pri":"1","rep":"1","docs.count":"0","docs.deleted":"0","store.size":"416b","pri.store.size":"208b"},{"health":"green","status":"open","index":"logs_server1","uuid":"u56jv2AyR2KOkruOfxIAnA","pri":"1","rep":"1","docs.count":"5386","docs.deleted":"0","store.size":"5.1mb","pri.store.size":"2.5mb"},{"health":"green","status":"open","index":".kibana_1","uuid":"dBCrfVblRPGVlYAIlP_Duw","pri":"1","rep":"1","docs.count":"3187","docs.deleted":"50","store.size":"24.8mb","pri.store.size":"12.4mb"},{"health":"green","status":"open","index":".tasks","uuid":"3RafayGeSNiqglO2BHof9Q","pri":"1","rep":"1","docs.count":"3","docs.deleted":"0","store.size":"39.9kb","pri.store.size":"19.9kb"},{"health":"green","status":"open","index":"filebeat-7.9.0-elastic_qa","uuid":"tktSYU14S3CrsrJb0ybpSQ","pri":"1","rep":"1","docs.count":"3009880","docs.deleted":"0","store.size":"1.6gb","pri.store.size":"850.1mb"},{"health":"green","status":"open","index":"analysis_test","uuid":"6ZHEAW1ST_qfg7mo4Bva4w","pri":"1","rep":"1","docs.count":"0","docs.deleted":"0","store.size":"416b","pri.store.size":"208b"},{"health":"green","status":"open","index":".apm-custom-link","uuid":"Y4N2TeVERrGacEGwY-NPAQ","pri":"1","rep":"1","docs.count":"0","docs.deleted":"0","store.size":"416b","pri.store.size":"208b"},{"health":"green","status":"open","index":"kibana_sample_data_ecommerce","uuid":"4FIWJKhGSr6bE72R0xEQyA","pri":"1","rep":"1","docs.count":"4675","docs.deleted":"0","store.size":"9.2mb","pri.store.size":"4.6mb"},{"health":"green","status":"open","index":".kibana_task_manager_1","uuid":"9afyndU_Q26oqOiEIoqRJw","pri":"1","rep":"1","docs.count":"6","docs.deleted":"2","store.size":"378.8kb","pri.store.size":"12.5kb"},{"health":"green","status":"open","index":".async-search","uuid":"2VbJgnN7SsqC-DWN64yXUQ","pri":"1","rep":"1","docs.count":"0","docs.deleted":"0","store.size":"3.9kb","pri.store.size":"3.7kb"}]`;
const columns = [
  {
    title: '索引名称',
    dataIndex: 'index',
    key: 'name',
  },
  {
    title: 'UUID',
    dataIndex: 'uuid',
    key: 'uuid',
  },
  {
    title: '文档数',
    dataIndex: 'docs.count',
    key: 'docs',
  },
  {
    title: '主分片数',
    dataIndex: 'pri',
    key: 'pri',
  },
  {
    title: '从分片数',
    dataIndex: 'rep',
    key: 'rep',
  },
  {
    title: '存储大小',
    dataIndex: 'store.size',
    key: 'size',
  },
];
@connect(({ profile, loading }) => ({
  profile,
  loading: loading.effects['profile/fetchBasic'],
}))

class IndexSummary extends Component {
    state = {
    };
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'profile/fetchBasic',
    });
  }
  render() {
    let data = JSON.parse(datasource);
    return (
        <Fragment>
            <Card>
              <div>
                <Row>
                  <Col span={12}> 
                    <Pie  {...config} />
                    <div style={{textAlign:"center", marginBottom:"10px",fontWeight:"1em", fontSize:"16px"}}>健康状态</div>
                  </Col>
                  <Col span={12}>
                  <Pie  {...shardConfig} />
                    <div style={{textAlign:"center", marginBottom:"10px",fontWeight:"1em", fontSize:"16px"}}>分片数</div>
                  </Col>
                </Row>
            </div>
            <div>
                <Table size={"small"} columns={columns} dataSource={data} />
              </div>
            </Card>
        </Fragment>
    );
  }
}

export default IndexSummary;
