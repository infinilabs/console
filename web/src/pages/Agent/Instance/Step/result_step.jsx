import Result from "@/components/Result";
import React, { Fragment } from "react";
import { Button, Row, Col } from "antd";
import styles from "@/pages/System/Cluster/steps/styles.less";
import { formatMessage } from "umi/locale";
import { isTLS, removeHttpSchema } from "@/utils/utils";

export const ResultStep = (props) => {
  const {
    clusterConfig: instanceConfig,
    oneMoreClick,
    goToInstanceList,
  } = props;
  const information = (
    <div className={styles.information}>
      <Row>
        <Col xs={24} sm={8} className={styles.label}>
          {formatMessage({
            id: "gateway.instance.field.name.label",
          })}：
        </Col>
        <Col xs={24} sm={16}>
          {instanceConfig?.name}
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
          {instanceConfig?.version?.number}
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={8} className={styles.label}>
          Endpoint ：
        </Col>
        <Col xs={24} sm={16}>
          {removeHttpSchema(instanceConfig?.endpoint)}
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={8} className={styles.label}>
          TLS：
        </Col>
        <Col xs={24} sm={16}>
          {formatMessage({
            id: instanceConfig?.isTLS
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
        Register Another Agent
      </Button>
      <Button onClick={goToInstanceList}>
        View Agent List
      </Button>
    </Fragment>
  );

  return (
    <Result
      type="success"
      title={formatMessage({
        id: "cluster.regist.step.complete.success",
      })}
      description=""
      extra={information}
      actions={actions}
      className={styles.result}
    />
  );
};
