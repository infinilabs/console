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
  Icon,
  Divider,
  Tabs,
  TimePicker,
  message,
  Spin,
} from "antd";
import { connect } from "dva";
import { FunctionOutlined, SendOutlined } from "@ant-design/icons";
import DropdownSelect from "@/components/GlobalHeader/DropdownSelect";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import request from "@/utils/request";
import { formatMessage, getLocale } from "umi/locale";
import { ESPrefix } from "@/services/common";
import { useCallback, useMemo, useState } from "react";
import clusterBg from "@/assets/cluster_bg.png";
import "@/assets/headercontent.scss";
import "../Rule/form.scss";
import useFetch from "@/lib/hooks/use_fetch";
import { isJSONString } from "@/utils/utils";
import FormHttpHeaders from "./FormHttpHeaders";
import VariablesExampleLabel from "../components/VariablesExampleLabel";

const { Option } = Select;
const { TextArea } = Input;
const InputGroup = Input.Group;
const { TabPane } = Tabs;

export default (props) => {
  const { valueProps = '', isAdvanced = false, handleTest, testLoading } = props;
  const editValue = props.value || {};
  const { getFieldDecorator } = props.form;

  return (
    <>
      {
        !isAdvanced && (
          <Form.Item label="Webhook URL">
            {getFieldDecorator([valueProps, 'webhook', 'url'].filter((item) => !!item).join('.'), {
              initialValue: editValue?.url,
              rules: [
                {
                  required: true,
                  message: "Please input URL!",
                },
              ],
            })(<Input />)}
          </Form.Item>
        )
      }
      <Form.Item label="HTTP Method">
        {getFieldDecorator([valueProps, 'webhook', 'method'].filter((item) => !!item).join('.'), {
          initialValue: editValue?.method || "POST",
          rules: [
            {
              required: true,
              message: "Please select method!",
            },
          ],
        })(
          <Select allowClear showSearch placeholder="POST">
            <Option value="POST">POST</Option>
            <Option value="GET">GET</Option>
          </Select>
        )}
      </Form.Item>
      <Form.Item label="Headers">
        <FormHttpHeaders
          form={props.form}
          headerParams={editValue.header_params}
          valueProps={valueProps}
        />
      </Form.Item>

      {
        !isAdvanced && (
          <Form.Item label={<span style={{
            fontWeight: 700,
            fontSize: 14,
            color: 'rgb(16, 16, 16)',
          }}>{formatMessage({ id: "alert.channel.form.webhook.template.title"})}</span>} colon={false}></Form.Item>
        )
      }
      
      <Form.Item label="Body" extra={<VariablesExampleLabel />}>
        {getFieldDecorator([valueProps, 'webhook', 'body'].filter((item) => !!item).join('.'), {
          initialValue: editValue?.body,
          rules: [
            {
              required: true,
              message: "Please input body!",
            },
          ],
        })(
          <TextArea
            rows={12}
            placeholder={`Event Title:{{.title}}
Event ID：{{.event_id}}，
Cluster Name：{{.resource_name}}，
Priority{{.priority}}，
Timestamp{{.timestamp}}，`}
          />
        )}
      </Form.Item>

      {
        handleTest && (
          <Form.Item label=" " colon={false}>
            <a style={{ marginRight: 6, pointerEvents: testLoading ? 'none' : 'auto' }} onClick={() => { !testLoading && handleTest() }}>
            {formatMessage({ id: "alert.channel.form.webhook.send.test"})}
            </a>
            <Spin spinning={testLoading} size="small"/>
          </Form.Item>
        )
      }
    </>
  );
};
