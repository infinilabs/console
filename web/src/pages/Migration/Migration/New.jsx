import MigrationForm from "./Form";
import { Card, Form, Steps, Spin, Button, message, Modal } from "antd";
import { useCallback, useState } from "react";
import request from "@/utils/request";
import { router } from "umi";
import { ESPrefix } from "@/services/common";
import { formatMessage } from "umi/locale";
import { FirstStep, MigrateSetting, RunSetting, InitConfig } from "./components/Step/Index";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";

const { Step } = Steps;
const { confirm } = Modal;

export default Form.create({ name: "form_new" })((props) => {
  const { history } = props;
  const steps = [
    {
      title: "Select Indices",
    },
    {
      title: "Initialize Configuration",
    },
    {
      title: "Migrate Setting",
    },
    {
      title: "Runtime Setting",
    },
  ];
  const [current, setCurrent] = useState(0);
  const [stepData, setStepData] = useState({cluster:{source:{},target:{}}});
  // console.log("stepData:", stepData);
  const [isLoading, setIsLoading] = useState(false);

  const next = async () => {
    if (current === 0) {
      if (!stepData?.cluster?.source?.id) {
        message.warning("Please select source cluster!");
        return;
      }
      if (!stepData?.cluster?.target?.id) {
        message.warning("Please select target cluster!");
        return;
      }
      if (!stepData?.indices || stepData?.indices?.length == 0) {
        message.warning("Please select indices!");
        return;
      }
    }else if(current === 1){
      const hasErr = (stepData?.indices || []).some((index=>index.initStatus === "error"));
      if(hasErr){
        confirm({
          title: 'Tips',
          content: 'Some indices are failed to initialize. Are you sure go to the next step?',
          onOk() {
            setCurrent(current + 1);
          },
          onCancel() {},
          okText: "Yes",
          cancelText:"No"
        });
        return
      }
    }

    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const renderContent = (current) => {
    if (current === 0) {
      return (
        <FirstStep
          stepData={stepData}
          setStepData={setStepData}
          form={props.form}
        />
      );
    }else if(current == 1) {
      return (
        <InitConfig
          stepData={stepData}
          setStepData={setStepData}
          form={props.form}
        />
      );
    }else if (current === 2) {
      return (
        <MigrateSetting
          stepData={stepData}
          setStepData={setStepData}
          form={props.form}
        />
      );
    } else if (current === 3) {
      return (
        <RunSetting
          stepData={stepData}
          setStepData={setStepData}
          form={props.form}
          onPrevious={prev}
        />
      );
    }
  };
  return (
    <PageHeaderWrapper>
      <Card>
        <Spin spinning={isLoading}>
          <div>
            <Steps current={current} style={{ marginBottom: 24 }}>
              {steps.map((item) => (
                <Step key={item.title} title={item.title} />
              ))}
            </Steps>
            <div className="steps-content">{renderContent(current)}</div>
            <div
              className="steps-action"
              style={{ textAlign: "left", marginTop: 10 }}
            >
              {current > 0 && (
                <Button style={{ marginRight: "8px" }} onClick={() => prev()}>
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
});
