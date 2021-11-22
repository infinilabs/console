import { Steps, Button, message, Spin, Card } from "antd";
import { connect } from "dva";
import { useState, useRef } from "react";
import { InitialStep, ExtraStep, ResultStep } from "./steps";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import styles from "./step.less";
import clusterBg from "@/assets/cluster_bg.png";
import { formatMessage } from "umi/locale";

const { Step } = Steps;

const steps = [
  {
    title: formatMessage({
      id: "cluster.regist.step.connect.title",
    }),
  },
  {
    title: formatMessage({
      id: "cluster.regist.step.confirm.title",
    }),
  },
  {
    title: formatMessage({
      id: "cluster.regist.step.complete.title",
    }),
  },
];

const ClusterStep = ({ current, changeStep, dispatch, history }) => {
  const formRef = useRef();
  const [clusterConfig, setClusterConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // const [clusterInfo, setClusterInfo] = useState({});

  const handleConnect = async () => {
    const result = await formRef.current
      .validateFields((errors, values) => {
        if (errors) {
          return false;
        }
        return values;
      })
      .catch((err) => {
        return false;
      });

    if (!result) {
      return false;
    }
    setIsLoading(true);
    const res = await dispatch({
      type: "clusterConfig/doTryConnect",
      payload: {
        basic_auth: {
          username: result.username,
          password: result.password,
        },
        host: result.host,
        schema: result.isTLS === true ? "https" : "http",
      },
    });
    if (res && !res.error) {
      setClusterConfig({
        ...result,
        ...res,
      });
      return true;
    } else {
      setIsLoading(false);
      return false;
    }
  };

  const handleCommit = async () => {
    const result = await formRef.current.validateFields((errors, values) => {
      if (errors) {
        return false;
      }
      // console.log(values);
      return values;
    });
    if (!result) {
      return fasle;
    }
    const newVals = {
      name: result.name,
      version: clusterConfig.version,
      host: clusterConfig.host,
      basic_auth: {
        username: clusterConfig.username || "",
        password: clusterConfig.password || "",
      },
      description: result.description,
      enabled: true,
      monitored: result.monitored,
      schema: clusterConfig.isTLS ? "https" : "http",
    };
    setIsLoading(true);
    const res = await dispatch({
      type: "clusterConfig/addCluster",
      payload: newVals,
    });
    if (res && !res.error) {
      return true;
    } else {
      setIsLoading(false);
      return false;
    }
  };

  const next = async () => {
    let result;
    if (current === 0) {
      result = await handleConnect();
    } else if (current === 1) {
      result = await handleCommit();
    }
    if (!result) {
      return;
    }
    setIsLoading(false);
    changeStep(current + 1);
  };

  const prev = () => {
    changeStep(current - 1);
  };

  const oneMoreClick = () => {
    setClusterConfig({});
    changeStep(0);
  };

  const goToClusterList = () => {
    history.push("/system/cluster");
  };

  const renderContent = (current) => {
    if (current === 0) {
      return <InitialStep ref={formRef} initialValue={clusterConfig} />;
    } else if (current === 1) {
      return <ExtraStep initialValue={clusterConfig} ref={formRef} />;
    } else if (current === 2) {
      return (
        <ResultStep
          clusterConfig={clusterConfig}
          oneMoreClick={oneMoreClick}
          goToClusterList={goToClusterList}
        />
      );
    }
  };

  const content = (
    <div className={styles.pageHeaderContent}>
      <p>
        {formatMessage({
          id: "cluster.regist.description",
        })}
      </p>
      {/* <div className={styles.contentLink}>
        <a>
          <img alt="" src="https://gw.alipayobjects.com/zos/rmsportal/MjEImQtenlyueSmVEfUD.svg" />{' '}
          快速开始
        </a>
        <a>
          <img alt="" src="https://gw.alipayobjects.com/zos/rmsportal/NbuDUAuBlIApFuDvWiND.svg" />{' '}
          产品简介
        </a>
        <a>
          <img alt="" src="https://gw.alipayobjects.com/zos/rmsportal/ohOEPSYdDTNnyMbGuyLb.svg" />{' '}
          产品文档
        </a>
      </div> */}
    </div>
  );

  const extraContent = (
    <div className={styles.extraImg}>
      <img src={clusterBg} />
    </div>
  );

  return (
    <PageHeaderWrapper
      title={formatMessage({
        id: "cluster.regist.title",
      })}
      content={content}
      extraContent={extraContent}
    >
      <Card>
        <Spin spinning={isLoading}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <Steps current={current} style={{ marginBottom: 24 }}>
              {steps.map((item) => (
                <Step key={item.title} title={item.title} />
              ))}
            </Steps>
            <div className="steps-content">{renderContent(current)}</div>
            <div className="steps-action" style={{ textAlign: "center" }}>
              {current === 1 && (
                <Button style={{ margin: "0 8px" }} onClick={() => prev()}>
                  {formatMessage({
                    id: "form.button.pre",
                  })}
                </Button>
              )}
              {current < steps.length - 1 && (
                <Button type="primary" onClick={() => next()}>
                  {formatMessage({
                    id: "form.button.next",
                  })}
                </Button>
              )}
            </div>
          </div>
        </Spin>
      </Card>
    </PageHeaderWrapper>
  );
};

const NewCluster = (props) => {
  const { dispatch, history } = props;
  const [current, setCurrent] = useState(0);
  return (
    <ClusterStep
      current={current}
      changeStep={setCurrent}
      history={history}
      dispatch={dispatch}
    />
  );
};

export default connect(({ clusterConfig }) => ({
  clusterConfig,
}))(NewCluster);
