import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Icon,
  Input,
  message,
  Result,
  Spin,
  Tooltip,
  Switch,
  Row,
  Col,
  Modal,
  List, 
} from "antd";
import styles from "../Initialization/index.less";
import request from "@/utils/request";
import { formatMessage } from "umi/locale";
const { confirm } = Modal;

const formItemLayout = {
  labelCol: {
    md: { span: 8 },
  },
  wrapperCol: {
    md: { span: 10 },
  },
};

const passwordRules = [
  {
    id: "guide.password.rule.length",
    text: formatMessage({ id: "guide.password.rule.length" }), 
    regex: /.{8,}/,
  },
  {
    id: "guide.password.rule.uppercase",
    text: formatMessage({ id: "guide.password.rule.uppercase" }), 
    regex: /[A-Z]/,
  },
  {
    id: "guide.password.rule.lowercase",
    text: formatMessage({ id: "guide.password.rule.lowercase" }),
    regex: /[a-z]/,
  },
  {
    id: "guide.password.rule.digit",
    text: formatMessage({ id: "guide.password.rule.digit" }),
    regex: /[0-9]/,
  },
  {
    id: "guide.password.rule.special",
    text: formatMessage({ id: "guide.password.rule.special" }), 
    regex: /[^A-Za-z0-9]/, 
  },
];

const checkPasswordStrength = (password = "") => {
  const fulfilled = [];
  const unfulfilled = [];
  
  passwordRules.forEach(rule => {
    if (rule.regex.test(password)) {
      fulfilled.push(rule);
    } else {
      unfulfilled.push(rule);
    }
  });

  return { fulfilled, unfulfilled, isValid: unfulfilled.length === 0 };
};

export default ({ onPrev, onNext, form, formData, onFormDataChange }) => {
  const [confirmDirty, setConfirmDirty] = useState(false);
  const [resetUser, setResetUser] = useState(false)
  const [loading, setLoading] = useState(false);
  const [passwordHelp, setPasswordHelp] = useState(null);

  const handlePrev = () => {
    const resetValues = {
      bootstrap_password: undefined,
      bootstrap_password_confirm: undefined,
      credential_secret: undefined,
      skip: false,
    };
    onFormDataChange(resetValues);
    form.setFieldsValue(resetValues, () => {
      onPrev();
    });
  };

  const onSubmit = (skip) => {
    if(verified === false){
      confirm({
        title:  formatMessage({
          id: "guide.settings.verify_secret.confirm.title",
        }),
        content:  formatMessage({
          id: "guide.settings.verify_secret.confirm.desc",
        }),
        onOk() {
          submitInitalize()
        },
        onCancel() {
      
        },
      });
      return
    }
    submitInitalize();
   
  };
  const submitInitalize = ()=>{
    form.validateFields(async (err, values) => {
      if (err) return;
      const newValues = {
        ...formData,
        ...values,
      };
      onFormDataChange(newValues);
      onInitialize(newValues);
    });
  }

  const onInitialize = async (formData) => {
    try {
      setLoading(true);
      const {
        hosts,
        isTLS,
        isAuth,
        username,
        password,
        skip,
        bootstrap_username,
        bootstrap_password,
        credential_secret,
      } = formData;
      const body = {};
      const host = hosts[0];
      const cluster = {
        endpoint: isTLS ? `https://${host}` : `http://${host}`,
        hosts: hosts,
        schema: isTLS ? "https" : "http",
      };
      if (isAuth) {
        cluster.username = username;
        cluster.password = password;
      }
      body.cluster = cluster;
      body.skip = skip;
      body.bootstrap_username = bootstrap_username;
      body.bootstrap_password = bootstrap_password;
      body.credential_secret = credential_secret;
      const res = await request(
        "/setup/_initialize",
        {
          method: "POST",
          body,
        },
        undefined,
        false
      );
      if (res?.success) {
        if(res.secret_mismatch === true){
          localStorage.setItem("secret_mismatch", "1");
        }
        onNext();
      } else {
        message.error(res?.error?.reason);
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleConfirmBlur = (e) => {
    const { value } = e.target;
    setConfirmDirty(confirmDirty || !!value);
  };

  const validateToNextPassword = (rule, value, callback) => {
    if (value && confirmDirty) {
      form.validateFields(["bootstrap_password_confirm"], { force: true });
    }
    callback();
  };

  const compareToFirstPassword = (rule, value, callback) => {
    if (value && value !== form.getFieldValue("bootstrap_password")) {
      callback(formatMessage({ id: "guide.confirm.password.validate" }));
    } else {
      callback();
    }
  };

  const generateKey = async () => {
    try {
      setLoading(true);
      let key = "";
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (let i = 0; i < 16; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      form.setFieldsValue({ credential_secret: key });
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const validatePasswordStrength = (rule, value, callback) => {
    if (!value) {
      callback();
      return;
    }
    const { isValid } = checkPasswordStrength(value);
    if (!isValid) {
      callback(formatMessage({ id: "guide.password.strength.invalid" })); 
    } else {
      callback();
    }
  };

  const { getFieldDecorator } = form;

  useEffect(() => {
    if(formData.skip){
      return
    }
    generateKey();
  }, []);

  const onResetUserChange = (checked)=>{
    setResetUser(checked);
  }

  const [verified, setVerified] = useState(undefined);
  const onVerifyClick = async ()=>{
    const secret = form.getFieldValue("credential_secret")
    if(!secret){
      message.error(formatMessage({ id: "guide.settings.verify_secret.empty_tip" }));
      return
    }

    setLoading(true);
    const {
      hosts,
      isTLS,
      isAuth,
      username,
      password,
    } = formData;
    const host = hosts[0];
    const cluster = {
      endpoint: isTLS ? `https://${host}` : `http://${host}`,
      hosts: hosts,
    };
    if (isAuth) {
      cluster.username = username;
      cluster.password = password;
    }
    const body = {
      credential_secret: secret,
      cluster,
    }
    const res = await request(
      "/setup/_validate_secret",
      {
        method: "POST",
        body,
      },
      undefined,
      false
    );
    if (res?.error) {
      message.error(res?.error?.reason);
    } else {
      setVerified(res.success)
    }
    setLoading(false);
  };

  return (
    <Spin spinning={loading}>
      <div className={styles.initialization}>
        {!formData.skip ? <Form
          form={form}
          {...formItemLayout}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          colon={false}
        >
          <Form.Item label=" ">
            <h1>{formatMessage({ id: "guide.user.title" })}</h1>
          </Form.Item>
          <Form.Item label={formatMessage({ id: "guide.username" })}>
            {getFieldDecorator("bootstrap_username", {
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: "guide.username.required" }),
                },
              ],
            })(<Input />)}
          </Form.Item>
          <Form.Item
            label={
              <span>
                {formatMessage({ id: "guide.password" })} &nbsp;
                <Tooltip overlayClassName={styles.passwordTooltip} title={
                  <List
                    size="small"
                    header={<div style={{fontWeight: 'bold'}}>{formatMessage({ id: "guide.password.rules.title" })}</div>} // e.g., "Password must contain:"
                    dataSource={passwordRules}
                    renderItem={item => <List.Item style={{padding: '2px 0', border: 'none'}}>{item.text}</List.Item>}
                  />
                }>
                  <Icon type="info-circle" style={{ color: 'rgba(0,0,0,.45)' }} />
                </Tooltip>
              </span>
            }
            extra={passwordHelp}
          >
            {getFieldDecorator("bootstrap_password", {
              initialValue: formData.bootstrap_password,
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: "guide.password.required" }),
                },
                {
                  validator: validatePasswordStrength,
                },
              ],
            })(<Input.Password />)}
          </Form.Item>

          <Form.Item
            label={formatMessage({ id: "guide.confirm.password" })}
            hasFeedback
          >
            {getFieldDecorator("bootstrap_password_confirm", {
              rules: [
                {
                  required: true,
                  message: formatMessage({
                    id: "guide.confirm.password.required",
                  }),
                },
                {
                  validator: compareToFirstPassword,
                },
              ],
            })(<Input.Password onBlur={handleConfirmBlur} />)}
          </Form.Item>
          <Form.Item
            label={formatMessage({ id: "guide.credential_secret" })}
            hasFeedback
            className={styles.credential}
          >
            {getFieldDecorator("credential_secret", {
              rules: [
                {
                  required: true,
                  message: formatMessage({
                    id: "guide.credential_secret.required",
                  }),
                },
              ],
            })(
              <Input.Password
                maxLength={32}
                addonAfter={
                  <Icon
                    onClick={generateKey}
                    className={styles.refresh}
                    type="reload"
                  />
                }
              />
            )}
          </Form.Item>
          <Form.Item label=" ">
            <div
              style={{
                color: "#ff0000",
                lineHeight: "20px",
                opacity: 0.7,
                wordBreak: "break-all",
              }}
            >
              {formatMessage({ id: "guide.credential_secret.tips" })}
            </div>
          </Form.Item>
          <Form.Item label=" ">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                style={{ width: "48%" }}
                type="primary"
                onClick={handlePrev}
              >
                {formatMessage({ id: "guide.step.prev" })}
              </Button>
              <Button style={{ width: "48%" }} type="primary" htmlType="submit">
                {formatMessage({ id: "guide.step.next" })}
              </Button>
            </div>
          </Form.Item>
        </Form>: 
        <Form
        form={form}
        {...formItemLayout}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        colon={false}
      >
        <Form.Item
          label={formatMessage({ id: "guide.credential_secret" })}
          hasFeedback={false}
          className={styles.credential}
        >
          <Row gutter={8}>
            <Col span={20}>
            {getFieldDecorator("credential_secret", {
            rules: [
              {
                required: true,
                message: formatMessage({
                  id: "guide.credential_secret.required",
                }),
              },
            ],
          })(
            <Input.Password
              maxLength={32}
              addonAfter={
                <Icon
                  onClick={generateKey}
                  className={styles.refresh}
                  type="reload"
                />
              }
            />
          )}
            </Col>
            <Col span={4}>
              <Button type="primary" ghost onClick={onVerifyClick}> {verified === true ? <Icon type="unlock" style={{color:"rgb(114, 194, 64)"}} />: <Icon type="lock" style={{color: verified === false ? "rgb(219, 0, 0)": "rgb(114, 194, 64)"}} />}{formatMessage({ id: "form.button.verify" })}</Button>
            </Col>
          </Row>
         
        </Form.Item>
        <Form.Item label=" ">
          <div
            style={{
              color: "#ff0000",
              lineHeight: "20px",
              opacity: 0.7,
              wordBreak: "break-all",
            }}
          >
            {formatMessage({ id: "guide.credential_secret.tips" })}
          </div>
        </Form.Item>
        <Form.Item label=" ">
          <Switch size="small" onChange={onResetUserChange} /><span style={{marginLeft:5}}>{formatMessage({ id: "guide.settings.reset_user.desc" })}</span>
        </Form.Item>
        {resetUser === true ? <>
        <Form.Item label={formatMessage({ id: "guide.username" })}>
          {getFieldDecorator("bootstrap_username", {
            rules: [
              {
                required: true,
                message: formatMessage({ id: "guide.username.required" }),
              },
            ],
          })(<Input />)}
        </Form.Item>
        <Form.Item label={formatMessage({ id: "guide.password" })}>
          {getFieldDecorator("bootstrap_password", {
            rules: [
              {
                required: true,
                message: formatMessage({ id: "guide.password.required" }),
              },
              {
                validator: validatePasswordStrength,
              },
            ],
          })(<Input.Password />)}
        </Form.Item>
        <Form.Item
          label={formatMessage({ id: "guide.confirm.password" })}
          hasFeedback
        >
          {getFieldDecorator("bootstrap_password_confirm", {
            rules: [
              {
                required: true,
                message: formatMessage({
                  id: "guide.confirm.password.required",
                }),
              },
              {
                validator: compareToFirstPassword,
              },
            ],
          })(<Input.Password onBlur={handleConfirmBlur} />)}
        </Form.Item>
        </>: null}
        <Form.Item label=" ">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              style={{ width: "48%" }}
              type="primary"
              onClick={handlePrev}
            >
              {formatMessage({ id: "guide.step.prev" })}
            </Button>
            <Button style={{ width: "48%" }} type="primary" disabled={formData.skip && typeof verified === "undefined"} htmlType="submit">
              {formatMessage({ id: "guide.step.next" })}
            </Button>
          </div>
        </Form.Item>
      </Form>}
      </div>
    </Spin>
  );
};
