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
        {!props.createResult ? (
          <Form {...formItemLayout}>
            <Form.Item label="User Name">
              {getFieldDecorator("name", {
                initialValue: editValue.name,
                rules: [
                  {
                    required: true,
                    message: "Please input name!",
                  },
                ],
              })(<Input readOnly={props.mode == "edit"} />)}
            </Form.Item>
            <Form.Item label="Nick Name">
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
            <Form.Item label="Phone">
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
            <Form.Item label="Email">
              {getFieldDecorator("email", {
                initialValue: editValue.email,
                rules: [
                  // {
                  //   required: true,
                  //   message: "Please input email!",
                  // },
                  {
                    type: "email",
                    message: "The input is not valid email!",
                  },
                ],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Role">
              {getFieldDecorator("roles", {
                initialValue: editValue.roles,
                rules: [
                  {
                    required: true,
                    message: "Please select roles!",
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
            <Form.Item label="Tags">
              {getFieldDecorator("tags", {
                initialValue: editValue.tags || [],
                rules: [],
              })(<TagEditor />)}
            </Form.Item>
            <Form.Item {...tailFormItemLayout}>
              <Button type="primary" onClick={handleSubmit} loading={isLoading}>
                Save
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
    title="Successfully Created User!"
    subTitle={`Password: ${password}`}
    extra={[
      <EuiCopy textToCopy={password}>
        {(copy) => (
          <Button type="primary" key="console" onClick={copy}>
            Copy Password
          </Button>
        )}
      </EuiCopy>,
    ]}
  />
);
