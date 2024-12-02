import { Modal, Button, Steps, message, Spin, Card } from "antd";
import { useState, useRef } from "react";
import { ConfigStep } from "./config";
import { formatMessage } from "umi/locale";
import request from "@/utils/request";

const { Step } = Steps;

const steps = [
  {
    title: formatMessage({ id: "gateway.guide.step.config" }),
  },
  {
    title: formatMessage({ id: "gateway.guide.step.app_config" }),
  },
  {
    title: formatMessage({ id: "gateway.guide.step.test_connection" }),
  },
];

export const GatewayGuide = (props) => {
  const [current, changeStep] = useState(0);
  const formRef = useRef();
  const [config, setConfig] = useState({
    ...props.selectCluster,
  });
  const [isLoading, setIsLoading] = useState(false);

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

    setConfig({
      ...result,
    });

    return true;
  };

  const handleCommit = async () => {
    const result = await formRef.current.validateFields((errors, values) => {
      if (errors) {
        return false;
      }
      return values;
    });
    if (!result) {
      return fasle;
    }
    const newVals = {
      ...config,
      ...result,
    };
    // setIsLoading(true);
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
    setConfig({ tags: ["default"] });
    changeStep(0);
  };

  const goToInstanceList = () => {
    history.push("/resource/runtime/instance");
  };

  const renderContent = (current) => {
    if (current === 0) {
      return <ConfigStep ref={formRef} initialValue={config} />;
    } else if (current === 1) {
      return <div />;
    } else if (current === 2) {
      return <div />;
    }
  };
  return (
    <div>
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
    </div>
  );
};
