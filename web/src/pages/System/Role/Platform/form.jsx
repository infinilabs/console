import {
  Form,
  Input,
  Switch,
  Select,
  InputNumber,
  Card,
  Button,
  Result,
  Row,
  Col,
  Transfer,
} from "antd";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { useCallback, useEffect, useMemo, useState } from "react";
import "@/assets/headercontent.scss";
import useFetch from "@/lib/hooks/use_fetch";
import TagEditor from "@/components/infini/TagEditor";
// import { formatESSearchResult } from "@/lib/elasticsearch/util";
import Permission from "./permission";
import ApiPermission from "./api_permission";
import request from "@/utils/request";
import { getMenuData } from "./menu";
import { formatMessage } from "umi/locale";
import { refreshApplicationSettings } from "@/utils/authority";

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
const PlatformRoleForm = (props) => {
  const { getFieldDecorator } = props.form;
  const [isLoading, setIsLoading] = useState(false);
  const [menuData, setMenuData] = useState(() => getMenuData());
  const breadcrumbList = [
    { title: "home", locale: "menu.home", href: "/" },
    { title: "system", locale: "menu.system" },
    { title: "security", locale: "menu.system.security" },
    {
      title: props.mode === "edit" ? "edit_role" : "new_role",
      locale: props.mode === "edit" ? "menu.system.edit_role" : "menu.system.new_role",
    },
  ];

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      props.form.validateFields(async (err, values) => {
        if (err) {
          return false;
        }
        if (typeof props.onSaveClick == "function") {
          setIsLoading(true);
          await props.onSaveClick(values);
          setIsLoading(false);
        }
      });
    },
    [props.form]
  );
  const onCancelClick = () => {
    props.history.go(-1);
  };

  const editValue = props.value || {};

  useEffect(() => {
    let isMounted = true;
    refreshApplicationSettings().finally(() => {
      if (isMounted) {
        setMenuData(getMenuData());
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
        {props.createResult ? (
          <Result
            status="success"
            title={formatMessage({ id: "system.security.role.create.success" })}
            extra={[
              <Button
                key="view-role-list"
                onClick={() => {
                  props.history.push(
                    `/system/security?_g=${encodeURIComponent(
                      JSON.stringify({ tab: "role" })
                    )}`
                  );
                }}
              >
                {formatMessage({
                  id: "system.security.role.create.button.view_list",
                })}
              </Button>,
              <Button
                key="continue-create-role"
                type="primary"
                onClick={props.onContinueCreate}
              >
                {formatMessage({
                  id: "system.security.role.create.button.continue",
                })}
              </Button>,
            ]}
          />
        ) : (
          <Form {...formItemLayout}>
            <Form.Item label={formatMessage({ id: "system.security.role.table.name" })}>
              {getFieldDecorator("name", {
                initialValue: editValue.name,
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "system.role.platform.name.required",
                    }),
                  },
                ],
              })(<Input disabled={props.mode == "edit"} />)}
            </Form.Item>
            <Form.Item
              label={formatMessage({
                id: "system.role.platform.feature_privilege.label",
              })}
            >
              {getFieldDecorator("privilege.platform", {
                initialValue: editValue.privilege?.platform || [],
                rules: [
                  {
                    validator: (rule, value, callback) => {
                      if (Array.isArray(value) && value.length > 0) {
                        callback();
                        return;
                      }
                      callback(
                        formatMessage({
                          id: "system.role.platform.feature_privilege.required",
                        })
                      );
                    },
                  },
                ],
              })(<Permission data={menuData} />)}
            </Form.Item>
            <Form.Item
              label={formatMessage({ id: "system.security.role.table.description" })}
            >
              {getFieldDecorator("description", {
                initialValue: editValue.description,
                rules: [],
              })(<Input.TextArea />)}
            </Form.Item>
            <Form.Item {...tailFormItemLayout}>
              <Button type="primary" onClick={handleSubmit} loading={isLoading}>
                {formatMessage({ id: "form.button.save" })}
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </PageHeaderWrapper>
  );
};

export default PlatformRoleForm;
