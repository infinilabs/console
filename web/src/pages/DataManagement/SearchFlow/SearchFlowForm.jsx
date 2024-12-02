import { Steps, Button, message, Card } from "antd";
import {
  SearchFlowFormProvider,
  useSearchFlowForm,
} from "./context/SearchFlowFormContext";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import BaseInfo from "./newsteps/BaseInfo";
import Parameters from "./newsteps/Parameters";
import "./SearchFlowForm.scss";
import QueryDSL from "./newsteps/QueryDSL";
import DependcyDSL from "./newsteps/DependcyDSL";

const { Step } = Steps;

const reducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case "setState":
      return {
        ...state,
        ...payload,
      };
  }
  return state;
};

const SearchFlowForm = () => {
  const { state, dispatch } = useSearchFlowForm();
  const { current } = state;
  const nextStep = React.useCallback(async () => {
    if (current == 0 && baseInfoRef.current) {
      const values = await baseInfoRef.current.validateFields(
        (errors, values) => {
          if (errors) {
            return;
          }
          return values;
        }
      );
      if (!values) {
        return;
      }
      dispatch({
        type: "setState",
        payload: {
          current: current + 1,
          base_info: values,
        },
      });
      return;
    }
    dispatch({
      type: "setState",
      payload: {
        current: current + 1,
      },
    });
  }, [dispatch, current]);
  const prevStep = React.useCallback(() => {
    dispatch({
      type: "setState",
      payload: {
        current: current - 1,
      },
    });
  }, [dispatch, current]);
  const baseInfoRef = React.useRef();
  const onParametersChange = (data) => {
    dispatch({
      type: "setState",
      payload: {
        parameters: data,
      },
    });
  };
  const steps = [
    {
      title: "Define Parameters",
      content: (
        <Parameters
          onChange={onParametersChange}
          parameters={state.parameters}
        />
      ),
    },
    {
      title: "Dependcy DSL",
      content: <DependcyDSL />,
    },
    {
      title: "Config Query DSL",
      content: <QueryDSL />,
    },
    {
      title: "Config Base Info",
      content: (
        <BaseInfo formRef={baseInfoRef} initialValue={state.base_info} />
      ),
    },
  ];
  return (
    <Card>
      <div>
        <Steps current={current} size="small">
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        <div className="steps-content">{steps[current].content}</div>
        <div className="steps-action">
          {current < steps.length - 1 && (
            <Button type="primary" onClick={nextStep}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button
              type="primary"
              onClick={() => message.success("Processing complete!")}
            >
              Done
            </Button>
          )}
          {current > 0 && (
            <Button style={{ marginLeft: 8 }} onClick={prevStep}>
              Previous
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default (props) => {
  return (
    <PageHeaderWrapper>
      <SearchFlowFormProvider reducer={reducer}>
        <SearchFlowForm {...props} />
      </SearchFlowFormProvider>
    </PageHeaderWrapper>
  );
};
