import React, { Fragment, useMemo, useReducer, useState } from "react";
import {
  Button,
  Card,
  Divider,
  Drawer,
  Input,
  Popconfirm,
  Table,
  message,
} from "antd";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import styles from "./Index.less";
import { formatMessage } from "umi/locale";
import moment from "moment";
import request from "@/utils/request";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import useFetch from "@/lib/hooks/use_fetch";
import CredentialForm from "./CredentialForm";
import { hasAuthority } from "@/utils/authority";
import AutoTextEllipsis from "@/components/AutoTextEllipsis";
import commonStyles from "@/common.less"

const { Search } = Input;

export default () => {
  const initialQueryParams = {
    from: 0,
    size: 10,
  };

  function reducer(queryParams, action) {
    switch (action.type) {
      case "search":
        return {
          ...queryParams,
          keyword: action.value,
        };
      case "pagination":
        return {
          ...queryParams,
          from: (action.value - 1) * queryParams.size,
        };
      case "pageSizeChange":
        return {
          ...queryParams,
          size: action.value,
        };
      case "refresh":
        return {
          ...queryParams,
          _t: new Date().getTime(),
        };
      default:
        throw new Error();
    }
  }

  const [visible, setVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState();

  const [queryParams, dispatch] = useReducer(reducer, initialQueryParams);

  const { loading, error, value, run } = useFetch(
    "/credential/_search",
    {
      queryParams: queryParams,
    },
    [queryParams]
  );

  const onRemove = async (id) => {
    const res = await request(`/credential/${id}`, {
      method: "DELETE",
    });
    if (res) {
      if (res.result === "deleted") {
        message.success(
          formatMessage({
            id: "app.message.delete.success",
          })
        );
        setTimeout(() => {
          run();
        }, 500);
      } else if (res.result === "not_found") {
        message.error(`Delete failed: not found`);
      }
    } else {
      console.log("Delete failed: ", res);
      message.error(
        formatMessage({
          id: "app.message.delete.failed",
        })
      );
    }
  };

  const onSubmit = async (value) => {
    const { name, type, tags, username, password } = value;
    const body = {
      name,
      type,
      tags,
      payload: {},
    };
    if (type === "basic_auth") {
      body.payload = {
        basic_auth: {
          username,
          password,
        },
      };
    }
    if (selectedItem) {
      if (body.payload?.basic_auth?.password === "") {
        delete body.payload.basic_auth["password"];
      }
      const res = await request(`/credential/${selectedItem.id}`, {
        method: "PUT",
        body,
      });
      if (res) {
        if (res.result === "updated") {
          message.success(
            formatMessage({
              id: "app.message.update.success",
            })
          );
          setTimeout(() => {
            setSelectedItem();
            setVisible(false);
            run();
          }, 500);
        } else if (res.result === "not_found") {
          message.error(`Update failed: not found`);
        }
      } else {
        console.log("Update failed: ", res);
        message.error(
          formatMessage({
            id: "app.message.update.failed",
          })
        );
      }
    } else {
      const res = await request(`/credential`, {
        method: "POST",
        body,
      });
      if (res) {
        if (res.result === "created") {
          message.success(
            formatMessage({
              id: "app.message.create.success",
            })
          );
          setTimeout(() => {
            setSelectedItem();
            setVisible(false);
            run();
          }, 500);
        }
      } else {
        console.log("Create failed: ", res);
        message.error(
          formatMessage({
            id: "app.message.create.failed",
          })
        );
      }
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: formatMessage({
        id: "credential.manage.table.column.name",
      }),
      dataIndex: "name",
      key: "name",
      render: (text) => <AutoTextEllipsis >{text}</AutoTextEllipsis>,
      className: commonStyles.maxColumnWidth
    },
    {
      title: formatMessage({
        id: "credential.manage.table.column.tags",
      }),
      dataIndex: "tags",
      key: "tags",
      render: (value) => value?.join(","),
    },
    {
      title: formatMessage({
        id: "credential.manage.table.column.type",
      }),
      dataIndex: "type",
      key: "type",
      width: 150,
    },
    {
      title: formatMessage({
        id: "credential.manage.table.column.updated",
      }),
      dataIndex: "updated",
      key: "updated",
      width: 180,
      render: (value) => moment(value).format("YYYY.MM.DD HH:mm:ss"),
    },
    {
      title: formatMessage({
        id: "credential.manage.table.column.status",
      }),
      dataIndex: "invalid",
      key: "invalid",
      render: (value) => {
        if(value === true){
          return <span style={{color:"red"}}>invalid</span>
        }
        return <span style={{color:"green"}}> valid</span>
      },
    },
    {
      title: formatMessage({
        id: "credential.manage.table.column.operation",
      }),
      width: 150,
      render: (text, record) => (
        <Fragment>
          <a
            onClick={() => {
              setSelectedItem(record);
              setVisible(true);
            }}
          >
            {formatMessage({
              id: "credential.manage.table.column.operation.edit",
            })}
          </a>
          <Divider type="vertical" />
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => onRemove(record.id)}
          >
            <a>
              {formatMessage({
                id: "credential.manage.table.column.operation.delete",
              })}
            </a>
          </Popconfirm>
        </Fragment>
      ),
    },
  ];

  if (!hasAuthority("system.credential:all")) {
    columns.splice(columns.length - 1, 1);
  }

  const { data, total } = useMemo(() => {
    return formatESSearchResult(value);
  }, [value]);

  return (
    <PageHeaderWrapper>
      <Card>
        <div
          style={{
            display: "flex",
            marginBottom: 20,
            flex: "1 1 auto",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ maxWidth: 500, flex: "1 1 auto" }}>
            <Search
              allowClear
              placeholder="Type keyword to search"
              enterButton="Search"
              onSearch={(value) => {
                dispatch({ type: "search", value });
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Button icon="redo" onClick={run}>
              {formatMessage({ id: "form.button.refresh" })}
            </Button>
            {hasAuthority("system.credential:all") && (
              <Button
                type="primary"
                icon="plus"
                onClick={() => {
                  setSelectedItem();
                  setVisible(true);
                }}
              >
                {formatMessage({
                  id: "form.button.new",
                })}
              </Button>
            )}
          </div>
        </div>
        <Table
          size={"small"}
          bordered
          loading={loading}
          columns={columns}
          dataSource={data}
          onChange={() => {}}
          rowKey="id"
          pagination={{
            size: "small",
            pageSize: queryParams.size,
            total: total.value || total,
            onChange: (page) => {
              dispatch({ type: "pagination", value: page });
            },
            showSizeChanger: true,
            onShowSizeChange: (_, size) => {
              dispatch({ type: "pageSizeChange", value: size });
            },
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>
      <Drawer
        width={640}
        onClose={() => {
          setVisible(false);
        }}
        visible={visible}
        title={formatMessage({
          id: selectedItem
            ? "credential.manage.drawer.edit.title"
            : "credential.manage.drawer.create.title",
        })}
        destroyOnClose
      >
        <CredentialForm record={selectedItem} onSubmit={onSubmit} />
      </Drawer>
    </PageHeaderWrapper>
  );
};
