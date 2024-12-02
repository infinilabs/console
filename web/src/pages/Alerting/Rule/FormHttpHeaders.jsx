import { Form, Input, Select, Button, Divider, Icon, Tabs } from "antd";
import { FunctionOutlined, SendOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import "./form.scss";

const { Option } = Select;
const { TextArea } = Input;
const InputGroup = Input.Group;

const FormHttpHeaders = (props) => {
  const { getFieldDecorator } = props.form;

  const channelPath = props.channelPath;

  const headerDefault = {
    id: "",
    key: "",
    value: "",
  };

  const [headers, setHeaders] = useState([]);
  useMemo(() => {
    let headerParams = [];
    if (props.headerParams) {
      if (Array.isArray(props.headerParams)) {
        headerParams = props.headerParams;
      } else {
        headerParams = Object.keys(props.headerParams).map((key) => {
          return {
            key: key,
            value: props.headerParams[key],
            id: Math.random().toString(),
          };
        });
      }
    }

    if (headerParams.length == 0) {
      headerParams = [headerDefault];
    }

    setHeaders(headerParams);
  }, [props.headerParams]);

  return (
    <div>
      {headers.map((headerParam, hi) => {
        return (
          <InputGroup compact key={headerParam.id}>
            <Form.Item>
              {getFieldDecorator(
                `channels${channelPath}[header_params][${hi}][key]`,
                {
                  initialValue:
                    headerParam?.key || (hi == 0 ? "Content-Type" : ""),
                  rules: [],
                }
              )(<Input style={{ width: 200 }} placeholder="Content-Type" />)}
            </Form.Item>
            <Form.Item>
              <Input
                style={{
                  width: 30,
                  borderLeft: 0,
                  pointerEvents: "none",
                  backgroundColor: "#fff",
                }}
                placeholder=":"
                disabled
              />
            </Form.Item>

            <Form.Item>
              {getFieldDecorator(
                `channels${channelPath}[header_params][${hi}][value]`,
                {
                  initialValue:
                    headerParam?.value || (hi == 0 ? "application/json" : ""),
                  rules: [],
                }
              )(
                <Input style={{ width: 200 }} placeholder="application/json" />
              )}
            </Form.Item>

            {headers.length > 1 ? (
              <Icon
                type="close-circle"
                className="dynamic-delete-button"
                onClick={() => {
                  let tmp = headers.filter((hf) => hf.id != headerParam.id);
                  setHeaders(tmp);
                }}
              />
            ) : null}
            {hi == 0 ? (
              <Icon
                type="plus-circle"
                className="dynamic-delete-button"
                onClick={() => {
                  if (headers.length >= 5) {
                    return;
                  }
                  setHeaders([
                    ...headers,
                    { ...headerDefault, id: Math.random() },
                  ]);
                }}
                disabled={headers.length >= 5 ? true : false}
              />
            ) : null}
          </InputGroup>
        );
      })}
    </div>
  );
};

export default FormHttpHeaders;
