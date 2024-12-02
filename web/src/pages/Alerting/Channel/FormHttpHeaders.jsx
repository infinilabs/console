import { Form, Input, Select, Button, Divider, Icon, Tabs } from "antd";
import { FunctionOutlined, SendOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import "../Rule/form.scss";

const { Option } = Select;
const { TextArea } = Input;
const InputGroup = Input.Group;
const { TabPane } = Tabs;

const FormHttpHeaders = (props) => {
  const { valueProps = "", onChange = () => {} } = props;
  const { getFieldDecorator } = props.form;

  const headerDefault = {
    id: "1",
    key: "",
    value: "",
  };
  const category = props.category;
  const k = props.k;

  const [headerParams] = useMemo(() => {
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
    return [headerParams];
  }, [props.headerParams]);

  const [headers, setHeaders] = useState(headerParams);

  return (
    <div>
      {headers?.map((headerParam, hi) => {
        return (
          <div key={headerParam.id}>
            <InputGroup compact>
              <Form.Item>
                {getFieldDecorator([valueProps, 'webhook', 'header_params_cache', `[${hi}]`, 'key'].filter((item) => !!item).join('.'), {
                  initialValue:
                    headerParam?.key || (hi == 0 ? "Content-Type" : ""),
                  rules: [],
                })(<Input style={{ width: 200 }} placeholder="Content-Type" onChange={onChange}/>)}
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
                {getFieldDecorator([valueProps, 'webhook', 'header_params_cache', `[${hi}]`, 'value'].filter((item) => !!item).join('.'), {
                  initialValue:
                    headerParam?.value || (hi == 0 ? "application/json" : ""),
                  rules: [],
                })(
                  <Input
                    style={{ width: 200 }}
                    placeholder="application/json"
                    onChange={onChange}
                  />
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
                      { ...headerDefault, id: Math.random().toString() },
                    ]);
                  }}
                  disabled={headers.length >= 5 ? true : false}
                />
              ) : null}
            </InputGroup>
          </div>
        );
      })}
    </div>
  );
};

export default FormHttpHeaders;
