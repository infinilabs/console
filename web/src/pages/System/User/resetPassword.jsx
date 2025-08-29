import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import router from "umi/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import request from "@/utils/request";
import "@/assets/headercontent.scss";
import { Input, Card, Form, Button, message, Tooltip, Icon, List } from "antd";
import { formatMessage } from "umi/locale";
import { checkPasswordStrength } from "@/utils/utils";
import styles from "./index.less";

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


// Define password rules in a reusable constant
export const passwordRules = [
  {
    id: 'guide.password.rule.length',
    text: formatMessage({ id: 'guide.password.rule.length' }), 
    regex: /.{8,}/,
  },
  {
    id: 'guide.password.rule.uppercase',
    text: formatMessage({ id: 'guide.password.rule.uppercase' }), 
    regex: /[A-Z]/,
  },
  {
    id: 'guide.password.rule.lowercase',
    text: formatMessage({ id: 'guide.password.rule.lowercase' }), 
    regex: /[a-z]/,
  },
  {
    id: 'guide.password.rule.digit',
    text: formatMessage({ id: 'guide.password.rule.digit' }), 
    regex: /[0-9]/,
  },
  {
    id: 'guide.password.rule.special',
    text: formatMessage({ id: 'guide.password.rule.special' }), 
    regex: /[^A-Za-z0-9]/,
  },
];

export default Form.create({ name: "user_form_new" })((props) => {
  const [isLoading, setIsLoading] = useState(false);
  const { form, match } = props;
  const { getFieldDecorator } = form;
  const [passwordHelp, setPasswordHelp] = useState(null);
  
  const onCancelClick = () => {
    props.history.go(-1);
  };

  const compareToFirstPassword = (rule, value, callback) => {
    if (value && value !== form.getFieldValue("password")) {
      callback(formatMessage({ id: "guide.confirm.password.validate" }));
    } else {
      callback();
    }
  };

  const validateToNextPassword = (rule, value, callback) => {
    if (!value) {
      callback();
      return;
    }
    const { isValid } = checkPasswordStrength(value,passwordRules);
    if (!isValid) {
      callback(formatMessage({ id: "guide.password.strength.invalid" }));
    } else {
      form.validateFields(["confirm"], { force: true });
      callback();
    }
  };

  const onSaveClick = (e) => {
    e.preventDefault();
    setIsLoading(true);
    form.validateFields(async (err, values) => {
      if (err) {
        setIsLoading(false);
        return false;
      }
      const resetRes = await request(`/user/${match.params.user_id}/password`, {
        method: "PUT",
        body: {
          password: values.password,
        },
      });
      if (resetRes && resetRes.result == "updated") {
        message.success(
          formatMessage({
            id: "app.message.save.success",
          })
        );
      }
      setIsLoading(false);
    });
  };
  return (
    <PageHeaderWrapper>
      <Card
        extra={
          <div>
            <Button type="primary" onClick={onCancelClick}>
              {formatMessage({ id: "form.button.goback" })}
            </Button>
          </div>
        }
      >
        <Form {...formItemLayout}>
          <Form.Item
            label={
              <span>
                {formatMessage({ id: "guide.password" })} &nbsp;
                <Tooltip overlayClassName={styles.passwordTooltip} title={
                  <List
                    size="small"
                    header={<div style={{fontWeight: 'bold'}}>{formatMessage({ id: "guide.password.rules.title" })}</div>} 
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
            {getFieldDecorator("password", {
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: "guide.password.required" }),
                },
                { validator: validateToNextPassword }, 
              ],
            })(<Input.Password/>)}
          </Form.Item>
          <Form.Item label={formatMessage({ id: "guide.confirm.password" })} hasFeedback>
            {getFieldDecorator("confirm", {
              initialValue: "",
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
            })(<Input type="password" />)}
          </Form.Item>

          <Form.Item {...tailFormItemLayout}>
            <Button type="primary" onClick={onSaveClick} loading={isLoading}>
              {formatMessage({ id: "form.save" })}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageHeaderWrapper>
  );
});
