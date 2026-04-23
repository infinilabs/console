import {
  Form,
  Input,
  Switch,
  Select,
  InputNumber,
  Card,
  Popover,
  Button,
  Row,
  Col,
  Icon,
  Divider,
  Tabs,
  TimePicker,
  message,
  Drawer,
} from "antd";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import request from "@/utils/request";
import { useHistory } from "react-router-dom";
import { formatMessage } from "umi/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./form.scss";
import useFetch from "@/lib/hooks/use_fetch";

const { Option } = Select;
const { TextArea } = Input;
const InputGroup = Input.Group;
const { TabPane } = Tabs;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
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

const MigrationForm = (props) => {
  const editValue = props.value || {};
  const { getFieldDecorator } = props.form;
  const history = useHistory();
  return (
    <PageHeaderWrapper>
      <Card
        bordered={false}
        title={props.title || ""}
        extra={
          <Button
            type="primary"
            onClick={() => {
              history.push("/data_tools/migration");
            }}
          >
            {formatMessage({ id: "form.button.goback" })}
          </Button>
        }
      >
        <Form {...formItemLayout}>
          <Form.Item label="Source clusters">No cluster available</Form.Item>

          <Form.Item {...tailFormItemLayout}>
            <Button type="primary" onClick={handleSubmit}>
              {formatMessage({ id: "form.button.save" })}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageHeaderWrapper>
  );
};
export default MigrationForm;
