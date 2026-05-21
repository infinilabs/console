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
  Result,
} from "antd";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
// import "./form.scss";
import { useCallback, useMemo, useState } from "react";
import "@/assets/headercontent.scss";
import useFetch from "@/lib/hooks/use_fetch";
import TagEditor from "@/components/infini/TagEditor";
// import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { EuiCopy } from "@elastic/eui";
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
const UserForm = (props) => {
  const { getFieldDecorator } = props.form;
  const [isLoading, setIsLoading] = useState(false);
  const breadcrumbList = [
    { title: "home", locale: "menu.home", href: "/" },
    { title: "system", locale: "menu.system" },
    { title: "security", locale: "menu.system.security" },
    {
      title: props.mode === "edit" ? "edit_user" : "new_user",
      locale:
        props.mode === "edit" ? "menu.system.edit_user" : "menu.system.new_user",
    },
  ];

  const { value: roleRes } = useFetch(
    `/role/_search`,
    { queryParams: { size: 10000 } },
    []
  );
  const roles = useMemo(() => {
    if (!roleRes) {
      return [];
    }
    return (roleRes.hits?.hits || []).map((hit) => {
      return {
        id: hit._id,
        name: hit._source.name,
      };
    });
  }, [roleRes]);
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setIsLoading(true);
      props.form.validateFields(async (err, values) => {
        if (err) {
          return false;
        }
        if (typeof props.onSaveClick == "function") {
          let newVals = {
            ...values,
          };
          if (newVals.roles) {
            newVals.roles = newVals.roles.map((rid) => {
              return roles.find((role) => role.id == rid);
            });
          }
          await props.onSaveClick(newVals);
          setIsLoading(false);
        }
      });
    },
    [props.form, roles]
  );
  const editValue = props.value || {};
  if (editValue.roles && editValue.roles.length && editValue.roles[0]?.name) {
    editValue.roles = editValue.roles.map((role) => role.id);
  }
  const onCancelClick = () => {
    props.history.go(-1);
  };

  return (
    <PageHeaderWrapper breadcrumbList={breadcrumbList}>
      <Card
        extra={
          <div>
            <Button type="primary" onClick={onCancelClick}>
              {formatMessage({ id: "form.button.goback" })}
            </Button>
          </div>
        }
      >
        {!props.createResult ? (
          <Form {...formItemLayout}>
            <Form.Item
              label={formatMessage({ id: "system.security.user.form.name" })}
            >
              {getFieldDecorator("name", {
                initialValue: editValue.name,
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "system.security.user.form.name.required",
                    }),
                  },
                ],
              })(<Input readOnly={props.mode == "edit"} />)}
            </Form.Item>
            <Form.Item
              label={formatMessage({ id: "system.security.user.form.nickname" })}
            >
              {getFieldDecorator("nick_name", {
                initialValue: editValue.nick_name,
                rules: [
                  // {
                  //   required: true,
                  //   message: "Please input nick name!",
                  // },
                ],
              })(<Input />)}
            </Form.Item>

            {/* <Form.Item label="Password">
            {getFieldDecorator("password", {
              initialValue: editValue.password || "",
              rules: [],
            })(<Input type="password" />)}
          </Form.Item> */}
            <Form.Item
              label={formatMessage({ id: "system.security.user.form.phone" })}
            >
              {getFieldDecorator("phone", {
                initialValue: editValue.phone,
                rules: [
                  // {
                  //   required: true,
                  //   message: "Please input phone!",
                  // },
                  // {
                  //   type: "string",
                  //   pattern: /^1[0-9]{10,10}$/,
                  //   message: "The input is not a valid phone number!",
                  // },
                ],
              })(<Input />)}
            </Form.Item>
            <Form.Item
              label={formatMessage({ id: "system.security.user.form.email" })}
            >
              {getFieldDecorator("email", {
                initialValue: editValue.email,
                rules: [
                  // {
                  //   required: true,
                  //   message: "Please input email!",
                  // },
                  {
                    type: "email",
                    message: formatMessage({
                      id: "system.security.user.form.email.invalid",
                    }),
                  },
                ],
              })(<Input />)}
            </Form.Item>
            <Form.Item
              label={formatMessage({ id: "system.security.user.form.roles" })}
            >
              {getFieldDecorator("roles", {
                initialValue: editValue.roles,
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "system.security.user.form.roles.required",
                    }),
                  },
                ],
              })(
                <Select
                  showSearch
                  mode="multiple"
                  filterOption={(input, option) =>
                    option.props.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {roles.map((r) => {
                    return (
                      <Select.Option key={r.id} value={r.id}>
                        {r.name}
                      </Select.Option>
                    );
                  })}
                </Select>
              )}
            </Form.Item>
            <Form.Item
              label={formatMessage({ id: "system.security.user.form.tags" })}
            >
              {getFieldDecorator("tags", {
                initialValue: editValue.tags || [],
                rules: [],
              })(<TagEditor />)}
            </Form.Item>
            <Form.Item {...tailFormItemLayout}>
              <Button type="primary" onClick={handleSubmit} loading={isLoading}>
                {formatMessage({ id: "form.button.save" })}
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <CreateResult password={props.createResult.password} />
        )}
      </Card>
    </PageHeaderWrapper>
  );
};

export default UserForm;

const CreateResult = ({ password }) => (
  <Result
    status="success"
    title={formatMessage({ id: "system.security.user.create.success" })}
    subTitle={formatMessage(
      { id: "system.security.user.create.password" },
      { password }
    )}
    extra={[
      <EuiCopy key="copy-password" textToCopy={password}>
        {(copy) => (
          <Button type="primary" key="console" onClick={copy}>
            {formatMessage({ id: "system.security.user.create.copy_password" })}
          </Button>
        )}
      </EuiCopy>,
    ]}
  />
);
