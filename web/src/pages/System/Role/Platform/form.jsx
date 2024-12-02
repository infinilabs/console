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
  Transfer,
} from "antd";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { useCallback, useEffect, useMemo, useState } from "react";
import "@/assets/headercontent.scss";
import useFetch from "@/lib/hooks/use_fetch";
import TagEditor from "@/components/infini/TagEditor";
// import { formatESSearchResult } from "@/lib/elasticsearch/util";
import Permission from "./permission";
import ApiPermission from "./api_permission";
import request from "@/utils/request";
import { menuData } from "./menu";

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
const PlatformRoleForm = (props) => {
  const { getFieldDecorator } = props.form;
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      props.form.validateFields(async (err, values) => {
        if (err) {
          return false;
        }
        if (typeof props.onSaveClick == "function") {
          setIsLoading(true);
          await props.onSaveClick(values);
          setIsLoading(false);
        }
      });
    },
    [props.form]
  );
  const onCancelClick = () => {
    props.history.go(-1);
  };

  const editValue = props.value || {};

  return (
    <PageHeaderWrapper>
      <Card
        extra={
          <div>
            <Button type="primary" onClick={onCancelClick}>
              Go back
            </Button>
          </div>
        }
      >
        <Form {...formItemLayout}>
          <Form.Item label="Name">
            {getFieldDecorator("name", {
              initialValue: editValue.name,
              rules: [
                {
                  required: true,
                  message: "Please input name!",
                },
              ],
            })(<Input disabled={props.mode == "edit"} />)}
          </Form.Item>
          <Form.Item label="Feature privileges">
            {getFieldDecorator("privilege.platform", {
              initialValue: editValue.privilege?.platform || [],
              rules: [
                {
                  required: true,
                  message: "Please select platform feature privilege!",
                },
              ],
            })(<Permission data={menuData} />)}
          </Form.Item>
          <Form.Item label="Description">
            {getFieldDecorator("description", {
              initialValue: editValue.description,
              rules: [],
            })(<Input.TextArea />)}
          </Form.Item>
          <Form.Item {...tailFormItemLayout}>
            <Button type="primary" onClick={handleSubmit} loading={isLoading}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageHeaderWrapper>
  );
};

export default PlatformRoleForm;
