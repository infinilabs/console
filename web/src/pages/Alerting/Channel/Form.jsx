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
  Radio,
} from "antd";
import { connect } from "dva";
import { FunctionOutlined, SendOutlined } from "@ant-design/icons";
import DropdownSelect from "@/components/GlobalHeader/DropdownSelect";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import request from "@/utils/request";
import { formatMessage } from "umi/locale";
import { useHistory } from "react-router-dom";
import { ESPrefix } from "@/services/common";
import { useCallback, useEffect, useMemo, useState } from "react";
import clusterBg from "@/assets/cluster_bg.png";
import "@/assets/headercontent.scss";
import "../Rule/form.scss";
import useFetch from "@/lib/hooks/use_fetch";
import { isJSONString } from "@/utils/utils";
import styles from "./Form.less"
import { CHANNELS } from "./Index";
import FormChannel from "./FormChannel";

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
      offset: 4,
    },
  },
};

const ChannelForm = (props) => {
  const [editValue, setEditValue] = useState(props.value || {});
  const { getFieldDecorator } = props.form;
  const history = useHistory();

  const [currentType, setCurrentType] = useState();

  const formatHeaderParams = (items) => {
    let header_params_obj = {};
    items.map((item) => {
      if (item.key.length && item.value.length) {
        header_params_obj[item.key] = item.value;
      }
    });
    return header_params_obj;
  };

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      props.form.validateFields((err, values) => {
        if (err) {
          return false;
        }

        if (typeof props.onSaveClick == "function") {
          if (values.sub_type === 'email') {
            values.type = 'email'
            values.webhook = undefined
          } else {
            values.type = 'webhook'
            values.email = undefined
          }
          if(values.type == "webhook"){
            values.webhook.header_params = formatHeaderParams(
              values.webhook.header_params_cache
            );
          }
          props.onSaveClick(values);
        }
      });
    },
    [props.form]
  );

  const onTypeChange = (value) => {
    const type = value || 'email'
    const channel = CHANNELS.find((item) => item.key === type)
    setCurrentType(channel.key === 'email' ? 'email' : 'webhook');
  }

  useEffect(() => {
    onTypeChange(editValue?.sub_type || editValue?.type);
  }, [editValue?.sub_type, editValue?.type])

  return (
    <PageHeaderWrapper>
      <Card
        bordered={false}
        title={props.title || ""}
        extra={
          <Button
            type="primary"
            onClick={() => {
              history.goBack();
            }}
          >
            {formatMessage({ id: "form.button.goback" })}
          </Button>
        }
      >
        <Form {...formItemLayout} className={`formCompact ${styles.form}`}>
          <Form.Item
            label={formatMessage({ id: "alert.channel.table.columns.name" })}
          >
            {getFieldDecorator("name", {
              initialValue: editValue?.name,
              rules: [
                {
                  required: true,
                  message: "Please input channel name!",
                },
              ],
            })(<Input />)}
          </Form.Item>

          <Form.Item
            label={formatMessage({
              id: "alert.channel.table.columns.channel_type",
            })}
          >
            {getFieldDecorator("sub_type", {
              initialValue: editValue?.sub_type || editValue?.type || "email",
              rules: [
                {
                  required: true,
                  message: "Please select channle type!",
                },
              ],
            })(
              <Radio.Group onChange={(e) => onTypeChange(e.target.value)}>
                {
                  CHANNELS.map((item) => (
                    <Radio.Button 
                      value={item.key} 
                      key={item.key}
                      disabled={editValue?.sub_type || editValue?.type ? (editValue?.sub_type || editValue?.type) !== item.key : false}
                    >
                      { item.icon && <Icon style={{verticalAlign: '-3px', fontSize: 16, marginRight: 8}} component={item.icon}/> }
                      {item.name}
                    </Radio.Button>
                  ))
                }
              </Radio.Group>
            )}
          </Form.Item>

          <FormChannel form={props.form} value={{...editValue, type:  currentType === 'email'? currentType : 'webhook', sub_type: currentType}}/>
          
          <Form.Item
            label={formatMessage({ id: "alert.channel.table.columns.enable" })}
          >
            {getFieldDecorator("enabled", {
              initialValue: editValue?.enabled,
              valuePropName: 'checked'
            })(
              <Switch />
            )}
          </Form.Item>

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
export default ChannelForm;
