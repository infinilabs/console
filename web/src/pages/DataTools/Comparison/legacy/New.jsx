import ComparisonForm from "./Form";
import { Card, Form, Steps, Spin, Button, message, Modal } from "antd";
import { useCallback, useState } from "react";
import request from "@/utils/request";
import { router } from "umi";
import { ESPrefix } from "@/services/common";
import { formatMessage } from "umi/locale";
import { FirstStep, CompareSetting, RunSetting } from "./components/Step/Index";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";

const { Step } = Steps;
const { confirm } = Modal;

export default Form.create({ name: "form_new" })((props) => {
  const { history } = props;
  const steps = [
    {
      title: formatMessage({ id: "migration.step.select_indices" }),
    },
    {
      title: formatMessage({ id: "migration.step.compare_setting" }),
    },
    {
      title: formatMessage({ id: "migration.step.runtime_setting" }),
    },
  ];
  const [current, setCurrent] = useState(0);
  const [stepData, setStepData] = useState({});
  // console.log("stepData:", stepData);
  const [isLoading, setIsLoading] = useState(false);

  const next = async () => {
    if (current === 0) {
      if (!stepData?.cluster?.source?.id) {
        message.warning(formatMessage({ id: "migration.warning.select_source_cluster" }));
        return;
      }
      if (!stepData?.cluster?.target?.id) {
        message.warning(formatMessage({ id: "migration.warning.select_target_cluster" }));
        return;
      }
      if (!stepData?.indices || stepData?.indices?.length == 0) {
        message.warning(formatMessage({ id: "migration.warning.select_indices" }));
        return;
      }
      let isReturn = false;
      for (let i = 0; i < stepData.indices.length; i++) {
        let item = stepData.indices[i];
        if (item.target.name.length == 0 || item.target.name == "N/A") {
          isReturn = true;
          message.warning(formatMessage({ id: "migration.warning.input_target_index_name" }));
          break;
        }
      }

      if (isReturn) {
        return;
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
    } else if (current === 1) {
      return (
        <CompareSetting
          stepData={stepData}
          setStepData={setStepData}
          form={props.form}
        />
      );
    } else if (current === 2) {
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
