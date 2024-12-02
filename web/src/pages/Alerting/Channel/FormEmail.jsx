import {
  Form,
  Input,
  Select,
  Icon,
  Spin,
} from "antd";
import "../Rule/form.scss";
import VariablesExampleLabel from "../components/VariablesExampleLabel";
import { useEffect, useMemo, useState } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { Link } from "umi";
import { formatMessage } from "umi/locale";

const { Option } = Select;
const { TextArea } = Input;

export default (props) => {
  const { valueProps = "", isAdvanced = false, handleTest, testLoading } = props;
  const editValue = props.value || {};
  const { getFieldDecorator } = props.form;

  const { loading, value } = useFetch("/email/server/_search");

  const servers = useMemo(() => {
    const result = formatESSearchResult(value);
    return result.data;
  }, [value])

  return (
    <>
      {
        !isAdvanced && (
          <>
            <Form.Item label={formatMessage({id: "alert.channel.form.email.server"})} >
              {getFieldDecorator([valueProps, 'email', 'server_id'].filter((item) => !!item).join('.'), {
                initialValue: editValue?.server_id,
                rules: [
                  {
                    required: true,
                    message: formatMessage({id: "alert.channel.form.email.server.required"}),
                  },
                ],
              })(
                <Select>
                  {
                    servers.map((item) => (
                      <Option key={item.id} value={item.id}>{item.name}</Option>
                    ))
                  }
                </Select>
              )}
            </Form.Item>

            <Form.Item label="  " colon={false}>
              <Link to="/system/email_server">{formatMessage({id: "alert.channel.form.email.server.new"})} &gt;</Link>
            </Form.Item>

            <Form.Item label={<span style={{
        fontWeight: 700,
        fontSize: 14,
        color: 'rgb(16, 16, 16)',
      }}>{formatMessage({id: "alert.channel.form.email.receive.title"})}</span>} colon={false}></Form.Item>

      <Form.Item label={formatMessage({id: "alert.channel.form.email.receiver"})}>
        {getFieldDecorator([valueProps, 'email', 'recipients', 'to'].filter((item) => !!item).join('.'), {
          initialValue: editValue?.recipients?.to || [],
          rules: [
            {
              required: true,
              message: formatMessage({id: "alert.channel.form.email.receiver.required"}),
            },
          ],
        })(
          <Select allowClear mode="tags" dropdownStyle={{ display: 'none'}}>
          </Select>
        )}
      </Form.Item>

      <Form.Item label={formatMessage({id: "alert.channel.form.email.cc"})}>
        {getFieldDecorator([valueProps, 'email', 'recipients', 'cc'].filter((item) => !!item).join('.'), {
          initialValue: editValue?.recipients?.cc || [],
        })(
          <Select allowClear mode="tags" dropdownStyle={{ display: 'none'}}>
          </Select>
        )}
      </Form.Item>
          <Form.Item label={<span style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'rgb(16, 16, 16)',
          }}>{formatMessage({id: "alert.channel.form.email.template.title"})}</span>} colon={false}></Form.Item>
            
          </>
        )
      }

      <Form.Item label={formatMessage({id: "alert.channel.form.email.template.subject"})}>
        {getFieldDecorator([valueProps, 'email', 'subject'].filter((item) => !!item).join('.'), {
          initialValue: editValue?.subject || "",
          rules: [
            {
              required: true,
              message: formatMessage({id: "alert.channel.form.email.template.subject.required"}),
            },
          ],
        })(<Input />)}
      </Form.Item>

      <Form.Item label={formatMessage({id: "alert.channel.form.email.template.content_type"})}>
        {getFieldDecorator([valueProps, 'email', 'content_type'].filter((item) => !!item).join('.'), {
          initialValue: editValue?.content_type || 'text/plain',
          rules: [
            {
              required: true,
              message: formatMessage({id: "alert.channel.form.email.template.content_type.required"}),
            },
          ],
        })(<Select >
          <Select.Option value="text/plain">text/plain</Select.Option>
          <Select.Option value="text/html">text/html</Select.Option>
        </Select>)}
      </Form.Item>

      <Form.Item label={formatMessage({id: "alert.channel.form.email.template.body"})} extra={<VariablesExampleLabel />}>
        {getFieldDecorator([valueProps, 'email', 'body'].filter((item) => !!item).join('.'), {
          initialValue: editValue?.body,
          rules: [
            {
              required: true,
              message: formatMessage({id: "alert.channel.form.email.template.body.required"}),
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
              {formatMessage({ id: "alert.channel.form.email.send.test"})}
            </a>
            <Spin spinning={testLoading} size="small"/>
          </Form.Item>
        )
      }
    </>
  );
};
