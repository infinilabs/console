import {
  Form,
  Input,
  Switch,
  Select,
  InputNumber,
  Card,
  Button,
  Row,
  Col,
} from "antd";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
// import "./form.scss";
import { useCallback, useMemo } from "react";
import "@/assets/headercontent.scss";
import Rules from "./rules";
import useFetch from "@/lib/hooks/use_fetch";
import { GatewayRouterProvider } from "./context";
// import { formatESSearchResult } from "@/lib/elasticsearch/util";

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 5 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 17 },
  },
};
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 5,
    },
  },
};
const RouterForm = (props) => {
  const { getFieldDecorator } = props.form;
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      props.form.validateFields((err, values) => {
        if (err) {
          return false;
        }
        if (typeof props.onSaveClick == "function") {
          props.onSaveClick(values);
        }
      });
    },
    [props.form]
  );
  // const flows = [
  //   { id: "aaa", name: "logging_flow" },
  //   { id: "bbb", name: "es_flow" },
  // ];
  const { value: flowsRes } = useFetch(
    `/gateway/flow/_search`,
    { queryParams: { size: 10000 } },
    []
  );
  const flows = useMemo(() => {
    if (!flowsRes) {
      return [];
    }
    return (flowsRes.hits?.hits || []).map((hit) => {
      return {
        id: hit._id,
        name: hit._source.name,
      };
    });
  }, [flowsRes]);
  const editValue = props.value || {};
  return (
    <PageHeaderWrapper>
      <GatewayRouterProvider value={{ flows: flows }}>
        <Card>
          <Form {...formItemLayout}>
            <Form.Item label="Router Name">
              {getFieldDecorator("name", {
                initialValue: editValue.name,
                rules: [
                  {
                    required: true,
                    message: "Please input router name!",
                  },
                ],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Default Flow">
              {getFieldDecorator("default_flow", {
                initialValue: editValue.default_flow,
                rules: [
                  {
                    required: true,
                    message: "Please select default flow!",
                  },
                ],
              })(
                <Select
                  showSearch
                  filterOption={(input, option) =>
                    option.props.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {flows.map((r) => {
                    return (
                      <Select.Option key={r.id} value={r.id}>
                        {r.name}
                      </Select.Option>
                    );
                  })}
                </Select>
              )}
            </Form.Item>
            <Form.Item label="Tracing Flow">
              {getFieldDecorator("tracing_flow", {
                initialValue: editValue.tracing_flow,
                rules: [
                  {
                    required: true,
                    message: "Please select tracing flow!",
                  },
                ],
              })(
                <Select
                  showSearch
                  filterOption={(input, option) =>
                    option.props.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {flows.map((r) => {
                    return (
                      <Select.Option key={r.id} value={r.id}>
                        {r.name}
                      </Select.Option>
                    );
                  })}
                </Select>
              )}
            </Form.Item>
            <Form.Item label="Rules">
              {getFieldDecorator("rules", {
                initialValue: editValue.rules,
                rules: [
                  {
                    required: true,
                    message: "Please config rules!",
                  },
                ],
              })(<Rules />)}
            </Form.Item>
            <Form.Item {...tailFormItemLayout}>
              <Button type="primary" onClick={handleSubmit}>
                Save
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </GatewayRouterProvider>
    </PageHeaderWrapper>
  );
};

export default RouterForm;
