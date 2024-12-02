import { Steps, Button, message, Spin, Card } from "antd";
import { connect } from "dva";
import { useState, useRef } from "react";
import { InitialStep, ExtraStep, ResultStep } from "./Step";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import "@/assets/headercontent.scss";
import { formatMessage } from "umi/locale";
import request from "@/utils/request";
import { isTLS, addHttpSchema } from "@/utils/utils";
import styles from "./new.less";
import { Link } from "umi";

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

const NewStep = ({ current, changeStep, history }) => {
  const formRef = useRef();
  const [instanceConfig, setInstanceConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    let result = await formRef.current
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
    result = {
      ...result,
      endpoint: (result.endpoint || "").trim(),
    };
    setIsLoading(true);

    result.endpoint = addHttpSchema(result.endpoint, result?.isTLS);
    const res = await request(`/instance/try_connect`, {
      method: "POST",
      body: {
        ...result,
      },
    });
    if (res.error) {
      setIsLoading(false);
      return false;
    }
    setInstanceConfig({
      ...result,
      instance_id: res.id,
      name: res.name,
      version: res?.application?.version,
      status: "Online",
      tags: ["default"],
    });

    return true;
  };

  const handleCommit = async () => {
    const result = await formRef.current
      .validateFields((errors, values) => {
        if (errors) {
          return false;
        }
        // console.log(values);
        return values;
      })
      .catch((err) => {
        return false;
      });
    if (!result) {
      return false;
    }

    if (result.hasOwnProperty("endpoint")) {
      delete result.endpoint;
    }
    const newVals = {
      ...instanceConfig,
      ...result,
    };
    setIsLoading(true);
    const res = await request(`/instance`, {
      method: "POST",
      body: newVals,
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
    setInstanceConfig({ tags: ["default"] });
    changeStep(0);
  };

  const goToInstanceList = () => {
    history.push("/resource/runtime/instance");
  };

  const renderContent = (current) => {
    if (current === 0) {
      return <InitialStep ref={formRef} initialValue={instanceConfig} />;
    } else if (current === 1) {
      return <ExtraStep initialValue={instanceConfig} ref={formRef} />;
    } else if (current === 2) {
      return (
        <ResultStep
          clusterConfig={instanceConfig}
          oneMoreClick={oneMoreClick}
          goToInstanceList={goToInstanceList}
        />
      );
    }
  };

  return (
    <PageHeaderWrapper>
      <Card className={styles.steps}>
        <div className={styles.header}>
          {formatMessage({
            id: "gateway.instance.regist",
          })}
          <Link to={"/resource/runtime/instance"}>
            <Button type="primary">
              {formatMessage({
                id: "form.button.goback",
              })}
            </Button>
          </Link>
        </div>
        <Spin spinning={isLoading}>
          <div className={styles.content}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <Steps current={current} style={{ marginBottom: 40 }}>
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
          </div>
        </Spin>
      </Card>
    </PageHeaderWrapper>
  );
};

export default (props) => {
  const { history } = props;
  const [current, setCurrent] = useState(0);
  return (
    <NewStep current={current} changeStep={setCurrent} history={history} />
  );
};
