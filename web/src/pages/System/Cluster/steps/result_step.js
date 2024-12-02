import Result from "@/components/Result";
import React, { Fragment } from "react";
import { Button, Row, Col } from "antd";
import styles from "./styles.less";
import { formatMessage } from "umi/locale";
import { MANUAL_VALUE } from "./initial_step";

export const ResultStep = (props) => {
  const { clusterConfig, oneMoreClick, goToClusterList } = props;
  const information = (
    <div className={styles.information}>
      <Row>
        <Col xs={24} sm={8} className={styles.label}>
          {formatMessage({
            id: "cluster.manage.table.column.name",
          })}
          ：
        </Col>
        <Col xs={24} sm={16}>
          {clusterConfig?.cluster_name}
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={8} className={styles.label}>
          {formatMessage({
            id: "cluster.manage.table.column.version",
          })}
          ：
        </Col>
        <Col xs={24} sm={16}>
          {clusterConfig?.version}
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={8} className={styles.label}>
          {formatMessage({
            id: "cluster.manage.table.column.endpoint",
          })}
          ：
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
          {formatMessage({
            id: clusterConfig?.isTLS
              ? "cluster.regist.step.complete.tls.yes"
              : "cluster.regist.step.complete.tls.no",
          })}
        </Col>
      </Row>
    </div>
  );
  const actions = (
    <Fragment>
      <Button type="primary" onClick={oneMoreClick}>
        {formatMessage({
          id: "cluster.regist.step.complete.btn.create",
        })}
      </Button>
      <Button onClick={goToClusterList}>
        {formatMessage({
          id: "cluster.regist.step.complete.btn.goto",
        })}
      </Button>
    </Fragment>
  );

  return (
    <Result
      type="success"
      title={formatMessage({
        id: "cluster.regist.step.complete.success",
      })}
      description={
        clusterConfig?.credential_id === MANUAL_VALUE ? 
        formatMessage({
          id: "cluster.regist.step.complete.success.desc",
        })
        :
        ""
      }
      extra={information}
      actions={actions}
      className={styles.result}
    />
  );
};
