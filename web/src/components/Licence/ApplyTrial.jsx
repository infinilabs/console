import request from "@/utils/request";
import {
  Modal,
  Checkbox,
  Button,
  Form,
  Icon,
  Input,
  message,
  Alert,
  Divider,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { formatMessage, getLocale } from "umi/locale";
import { getWebsitePathByLang } from "@/utils/utils";
import "./ApplyTrial.scss";
import LicenceDesc from "./LicenceDesc";

const { TextArea } = Input;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
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
      offset: 6,
    },
  },
};

const tipsFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 20,
      offset: 2,
    },
  },
};

export default Form.create()((props) => {
  const { form, onLicenceUpdate } = props;
  const { getFieldDecorator } = form;
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const defaultState = {
    status: -1,
    error_msg: "",
    licensed: false,
  };
  const [state, setState] = useState(defaultState);

  const onSubmit = () => {
    form.validateFields(async (err, values) => {
      if (err) {
        return false;
      }
      setLoading(true);

      const res = await request(`/_license/request_trial?lang=${getLocale()}`, {
        method: "POST",
        body: values,
      });
      if (res?.acknowledged) {
        let ack = { status: 1 };
        if (res?.license) {
          ack.licensed = true;
          onLicenceUpdate();
        }
        setState({ ...state, ...ack });
      } else {
        let error_msg = "";
        if (typeof res === "undefined") {
          error_msg = "Request timeout  or network problem";
        } else if (res?.error?.reason) {
          error_msg = res.error.reason;
        }
        setState({ ...state, status: 0, error_msg: error_msg });
      }
      setLoading(false);
    });
  };

  const onClose = () => {
    props.onClose(); //close parent modal
    setVisible(false);
    setState({ ...state, ...defaultState });
  };

  return (
    <>
      <Button type="primary" size="small" onClick={() => setVisible(true)}>
        {formatMessage({ id: "license.button.apply_trial" })}
      </Button>
      <Modal
        title={formatMessage({ id: "license.label.apply_trial.title" })}
        visible={visible}
        closable
        footer={null}
        onCancel={onClose}
        destroyOnClose
        width={560}
        className={"apply-trial-modal"}
      >
        {state.status === -1 ? (
          <Form {...formItemLayout} colon={false}>
            <Form.Item {...tipsFormItemLayout}>
              <div className="tips-wrap">
                <Icon type="info-circle" theme="twoTone" />
                <span className="tips-text">
                  {formatMessage({
                    id: "license.label.apply.trial_tips",
                  })}
                </span>
              </div>
            </Form.Item>

            <Form.Item
              label={formatMessage({
                id: "license.label.apply.organization",
              })}
            >
              {getFieldDecorator("organization", {
                initialValue: "",
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "license.label.apply.organization.required",
                    }),
                  },
                ],
              })(<Input maxLength={100} />)}
            </Form.Item>
            <Form.Item
              label={formatMessage({
                id: "license.label.apply.contact",
              })}
            >
              {getFieldDecorator("contact", {
                initialValue: "",
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "license.label.apply.contact.required",
                    }),
                  },
                ],
              })(<Input maxLength={50} />)}
            </Form.Item>
            <Form.Item
              label={formatMessage({
                id: "license.label.apply.email",
              })}
            >
              {getFieldDecorator("email", {
                initialValue: "",
                rules: [
                  {
                    type: "email",
                    message: formatMessage({
                      id: "license.label.apply.email.valid",
                    }),
                  },
                  {
                    required: true,
                    message: formatMessage({
                      id: "license.label.apply.email.required",
                    }),
                  },
                ],
              })(
                <Input
                  maxLength={50}
                  placeholder={formatMessage({
                    id: "license.label.apply.email.placeholder",
                  })}
                />
              )}
            </Form.Item>
            <Form.Item
              label={formatMessage({
                id: "license.label.apply.phone",
              })}
            >
              {getFieldDecorator("phone", {
                initialValue: "",
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "license.label.apply.phone.required",
                    }),
                  },
                ],
              })(<Input maxLength={20} />)}
            </Form.Item>

            <Form.Item {...tailFormItemLayout}>
              <Button type="primary" block loading={loading} onClick={onSubmit}>
                {formatMessage({ id: "license.label.apply.submit" })}
              </Button>
            </Form.Item>
            <Form.Item {...tailFormItemLayout}>
              {getFieldDecorator("agreement", {
                valuePropName: "checked",
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "license.label.agree.required",
                    }),
                  },
                ],
              })(
                <Checkbox>
                  {formatMessage({ id: "license.label.agree" })}{" "}
                  <a
                    target="_blank"
                    href={`${getWebsitePathByLang()}/agreement/console`}
                  >
                    {formatMessage({ id: "license.label.agreement" })}
                  </a>
                </Checkbox>
              )}
            </Form.Item>
          </Form>
        ) : null}
        {state.status === 0 ? (
          <div className="status-content">
            <Icon
              type="close-circle"
              theme="filled"
              style={{
                fontSize: 48,
                color: "#FF0000",
                marginTop: -20,
                marginBottom: 10,
              }}
            />
            {state.error_msg ? (
              <Alert
                message={"Error Message"}
                description={state.error_msg}
                type="error"
              />
            ) : null}

            <div>
              {formatMessage({ id: "license.label.apply.submit.failed.tips" })}
            </div>
            <div>
              {formatMessage({
                id: "license.label.apply.submit.official_website.link",
              })}
              <a
                target="_blank"
                href={`${APP_OFFICIAL_WEBSITE}/company/contact`}
              >{`${APP_OFFICIAL_WEBSITE}/company/contact`}</a>
            </div>
          </div>
        ) : null}
        {state.status === 1 ? (
          <div className="status-content">
            <Icon
              type="check-circle"
              theme="filled"
              style={{
                fontSize: 48,
                color: "#1890ff",
                marginTop: 0,
                marginBottom: 10,
              }}
            />
            <div className="successfully-tips">
              {formatMessage({
                id: "license.label.apply.submit.successfully.tips",
              })}
            </div>
            <div>
              {state.licensed && props.licence?.license_type ? (
                <>
                  <Divider orientation="left">
                    {formatMessage({
                      id: "license.label.apply.submit.divider",
                    })}
                  </Divider>
                  <div>
                    <LicenceDesc licence={props.licence} />
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
});
