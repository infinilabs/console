import Result from '@/components/Result';
import React, { Fragment } from 'react';
import { Button, Row, Col } from 'antd';
import styles from './styles.less';

export const ResultStep = (props)=>{
  const {clusterConfig, oneMoreClick, goToClusterList} = props;
  const information = (
    <div className={styles.information}>
      <Row>
        <Col xs={24} sm={8} className={styles.label}>
          集群名称：
        </Col>
        <Col xs={24} sm={16}>
          {clusterConfig?.cluster_name}
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={8} className={styles.label}>
          集群版本：
        </Col>
        <Col xs={24} sm={16}>
        {clusterConfig?.version}
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={8} className={styles.label}>
          集群地址：
        </Col>
        <Col xs={24} sm={16}>
        {clusterConfig?.host}
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={8} className={styles.label}>
          TLS：
        </Col>
        <Col xs={24} sm={16}>
        {clusterConfig?.isTLS ? '是': '否'}
        </Col>
      </Row>
    </div>
  );
  const actions = (
    <Fragment>
      <Button type="primary" onClick={oneMoreClick}>
        再创建一个集群
      </Button>
      <Button onClick={goToClusterList}>查看集群列表</Button>
    </Fragment>
  );

  return (
    <Result
      type="success"
      title="创建成功"
      description=""
      extra={information}
      actions={actions}
      className={styles.result}
    />
  );
}