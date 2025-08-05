import router from "umi/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import request from "@/utils/request";
import { Input, Card, Form, Button, message } from "antd";
import { formatMessage } from "umi/locale";

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

export default Form.create({ name: "password_modify_form" })((props) => {
  const onCancelClick = () => {
    props.history.go(-1);
  };
  const [isLoading, setIsLoading] = useState(false);
  const { form, match } = props;
  const { getFieldDecorator } = form;

  const compareToFirstPassword = (rule, value, callback) => {
    if (value && value !== form.getFieldValue("new_password")) {
      callback("Two passwords that you enter is inconsistent!");
    } else {
      callback();
    }
  };

  const validateToNextPassword = (rule, value, callback) => {
    if (value) {
      if (value.length < 8) {
        callback("The password must contain at least 8 characters");
        return;
      }
      form.validateFields(["confirm"], { force: true });
    }
    callback();
  };
  const onSaveClick = (e) => {
    e.preventDefault();
    setIsLoading(true);
    form.validateFields(async (err, values) => {
      if (err) {
        setIsLoading(false);
        return false;
      }
      const resetRes = await request(`/account/password`, {
        method: "PUT",
        body: {
          old_password: values.old_password,
          new_password: values.new_password,
        },
      });
      if (resetRes && resetRes.status == "ok") {
        message.success("save succeed");
      }
      setIsLoading(false);
    });
  };
  return (
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
        <Form.Item label="Password" hasFeedback>
          {getFieldDecorator("old_password", {
            initialValue: "",
            rules: [
              {
                required: true,
                message: "Please input password!",
              },
            ],
          })(<Input type="password" />)}
        </Form.Item>
        <Form.Item label="New Password" hasFeedback>
          {getFieldDecorator("new_password", {
            initialValue: "",
            rules: [
              {
                required: true,
                message: "Please input password!",
              },
              {
                validator: validateToNextPassword,
              },
            ],
          })(<Input type="password" />)}
        </Form.Item>
        <Form.Item label="Confirm New Password" hasFeedback>
          {getFieldDecorator("confirm", {
            initialValue: "",
            rules: [
              {
                required: true,
                message: "Please input confirm new password!",
              },
              {
                validator: compareToFirstPassword,
              },
            ],
          })(<Input type="password" />)}
        </Form.Item>

        <Form.Item {...tailFormItemLayout}>
          <Button type="primary" onClick={onSaveClick} loading={isLoading}>
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
});
