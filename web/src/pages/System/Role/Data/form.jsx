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
import request from "@/utils/request";
import ClusterField from "./cluster_field";
import ApiPrivilegeField from "./api_privilege_field";
import IndexPrivilegeField from "./index_privilege_field";
import { useGlobal } from "@/layouts/GlobalContext";
import { DataRoleFromContext } from "./context";
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

const DataRoleForm = (props) => {
  const { getFieldDecorator } = props.form;
  const [isLoading, setIsLoading] = useState(false);
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
          let permissions = [];
          (values.privilege?.elasticsearch?.cluster?.permissions || []).forEach(
            (item) => {
              Object.entries(item).forEach((pair) => {
                const [group, privileges] = pair;
                if (group == "_key") {
                  return true;
                }
                permissions = permissions.concat(privileges);
              });
            }
          );
          values.privilege.elasticsearch.cluster.permissions = permissions;
          values.privilege.elasticsearch.index = (
            values.privilege?.elasticsearch?.index || []
          ).map((item) => {
            delete item._key;
            return item;
          });
          setIsLoading(true);
          await props.onSaveClick({
            ...values,
          });
          setIsLoading(false);
        }
      });
    },
    [props.form]
  );
  const onCancelClick = () => {
    props.history.go(-1);
  };
  const [permissions, setPermissions] = useState({});
  const fetchInitData = async () => {
    const permissionRes = await request(`/permission/elasticsearch`);
    if (permissionRes && !permissionRes.error) {
      permissionRes.cluster_privileges["*"] = ["*"];
      setPermissions(permissionRes);
    }
  };

  const { clusterList } = useGlobal();
  useEffect(() => {
    fetchInitData();
  }, []);
  const editValue = useMemo(() => {
    if (!props.value) {
      return {};
    }
    let clusterPrivilege = {};
    (props.value.privilege?.elasticsearch?.cluster?.permissions || []).forEach(
      (item) => {
        const [cate, privilege] = item.split(".");
        if (cate == "*") {
          clusterPrivilege[cate] = ["*"];
          return;
        }
        if (cate && privilege) {
          if (!clusterPrivilege[cate]) {
            clusterPrivilege[cate] = [];
          }
          clusterPrivilege[cate].push(item);
        }
      }
    );

    clusterPrivilege = Object.entries(clusterPrivilege).map((item) => {
      const [cate, privileges] = item;
      return {
        [cate]: privileges,
      };
    });
    const newVal = {
      ...props.value,
    };
    newVal.privilege.elasticsearch.cluster.permissions = clusterPrivilege;

    return newVal;
  }, [props.value]);
  const [selectedClusterIDs, setSelectedClusterIDs] = useState(() => {
    return (
      editValue.privilege?.elasticsearch?.cluster?.resources || [{ id: "*" }]
    ).map((c) => c.id);
  });

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
          <DataRoleFromContext.Provider value={{ selectedClusterIDs }}>
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
              <Form.Item label={formatMessage({ id: "system.role.data.cluster.label" })}>
                {getFieldDecorator("privilege.elasticsearch.cluster.resources", {
                  initialValue: editValue.privilege?.elasticsearch?.cluster
                    ?.resources || [{ id: "*", name: "*" }],
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: "system.role.data.cluster.required",
                      }),
                    },
                  ],
                })(
                  <ClusterField
                    options={clusterList}
                    setSelectedClusterIDs={setSelectedClusterIDs}
                  />
                )}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "system.role.data.cluster_privilege.label",
                })}
              >
                {getFieldDecorator(
                  "privilege.elasticsearch.cluster.permissions",
                  {
                    initialValue: editValue.privilege?.elasticsearch?.cluster
                      ?.permissions || [{ "*": ["*"] }],
                    rules: [
                      {
                        required: true,
                        message: formatMessage({
                          id: "system.role.data.cluster_privilege.required",
                        }),
                      },
                    ],
                  }
                )(<ApiPrivilegeField options={permissions.cluster_privileges} />)}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "system.role.data.index_privilege.label",
                })}
              >
                {getFieldDecorator("privilege.elasticsearch.index", {
                  initialValue: editValue.privilege?.elasticsearch?.index || [
                    { name: ["*"], permissions: ["*"] },
                  ],
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: "system.role.data.index_privilege.required",
                      }),
                    },
                  ],
                })(
                  <IndexPrivilegeField
                    privileges={permissions.index_privileges}
                  />
                )}
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
          </DataRoleFromContext.Provider>
        )}
      </Card>
    </PageHeaderWrapper>
  );
};

export default DataRoleForm;
