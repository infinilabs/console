import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import router from "umi/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import request from "@/utils/request";
import "@/assets/headercontent.scss";
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

export default Form.create({ name: "user_form_new" })((props) => {
  const onCancelClick = () => {
    props.history.go(-1);
  };
  const [isLoading, setIsLoading] = useState(false);
  const { form, match } = props;
  const { getFieldDecorator } = form;

  const compareToFirstPassword = (rule, value, callback) => {
    if (value && value !== form.getFieldValue("password")) {
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
              Go back
            </Button>
          </div>
        }
      >
        <Form {...formItemLayout}>
          <Form.Item label="Password" hasFeedback>
            {getFieldDecorator("password", {
              initialValue: "",
              rules: [
                {
                  required: true,
                  message: "Please password!",
                },
                {
                  validator: validateToNextPassword,
                },
              ],
            })(<Input type="password" />)}
          </Form.Item>
          <Form.Item label="Confirm Password" hasFeedback>
            {getFieldDecorator("confirm", {
              initialValue: "",
              rules: [
                {
                  required: true,
                  message: "Please input confirm password!",
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
    </PageHeaderWrapper>
  );
});
