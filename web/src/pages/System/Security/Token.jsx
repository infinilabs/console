import React, { useMemo, useReducer, useState } from "react";
import {
  Button,
  Card,
  Divider,
  Drawer,
  Form,
  Icon,
  Input,
  Modal,
  Popconfirm,
  Table,
  message,
} from "antd";
import { formatMessage } from "umi/locale";
import request from "@/utils/request";
import useFetch from "@/lib/hooks/use_fetch";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { hasAuthority } from "@/utils/authority";
import SearchInput from "@/components/infini/SearchInput";
import moment from "moment";

const firstColumnIconStyle = {
  marginRight: 8,
  color: "#999",
  fontSize: 12,
};

const TokenForm = Form.create()(({ form, record, onSubmit, submitLoading }) => {
  const { getFieldDecorator, validateFields } = form;
  const isEdit = !!record;
  const submit = (e) => {
    e.preventDefault();
    validateFields((err, values) => {
      if (!err) {
        onSubmit(values);
      }
    });
  };

  return (
    <Form layout="vertical" onSubmit={submit}>
      <Form.Item label={formatMessage({ id: "system.security.token.form.name" })}>
        {getFieldDecorator("name", {
          initialValue: record?.name || "",
          rules: [
            {
              required: true,
              message: formatMessage({ id: "system.security.token.form.name.required" }),
            },
          ],
        })(<Input />)}
      </Form.Item>
      <Form.Item label={formatMessage({ id: "system.security.token.form.description" })}>
        {getFieldDecorator("description", {
          initialValue: record?.description || "",
        })(<Input.TextArea rows={3} />)}
      </Form.Item>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button onClick={() => onSubmit(null)} disabled={submitLoading}>
          {formatMessage({ id: "form.button.cancel" })}
        </Button>
        <Button type="primary" htmlType="submit" loading={submitLoading}>
          {isEdit
            ? formatMessage({ id: "form.button.update" })
            : formatMessage({ id: "form.button.create" })}
        </Button>
      </div>
    </Form>
  );
});

const Token = () => {
  const initialQueryParams = {
    from: 0,
    size: 20,
    keyword: "",
  };

  function reducer(queryParams, action) {
    switch (action.type) {
      case "search":
        return {
          ...queryParams,
          from: 0,
          keyword: action.value,
        };
      case "pagination":
        return {
          ...queryParams,
          from: (action.current - 1) * action.pageSize,
          size: action.pageSize,
        };
      case "refresh":
        return {
          ...queryParams,
          _t: Date.now(),
        };
      default:
        return queryParams;
    }
  }

  const [queryParams, dispatch] = useReducer(reducer, initialQueryParams);
  const [visible, setVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState();

  const canSearch = hasAuthority("security:auth:api-token:search");
  const canCreate = hasAuthority("security:auth:api-token:create");
  const canUpdate = hasAuthority("security:auth:api-token:update");
  const canDelete = hasAuthority("security:auth:api-token:delete");

  const { loading, value, run } = useFetch(
    "/auth/access_token/_search",
    {
      queryParams,
      noticeable: false,
    },
    [queryParams],
    canSearch
  );

  const openCreateTokenResult = (token) => {
    Modal.success({
      title: formatMessage({ id: "system.security.token.create.result.title" }),
      content: (
        <div>
          <p>{formatMessage({ id: "system.security.token.create.result.tip" })}</p>
          <Input.TextArea readOnly rows={4} value={token} />
        </div>
      ),
      okText: formatMessage({ id: "form.button.ok" }),
      width: 640,
    });
  };

  const onDelete = async (tokenID) => {
    const res = await request(`/auth/access_token/${tokenID}`, {
      method: "DELETE",
    });
    if (res?.result === "deleted") {
      message.success(formatMessage({ id: "app.message.delete.success" }));
      run();
      return;
    }
    message.error(res?.error?.reason || formatMessage({ id: "app.message.delete.failed" }));
  };

  const onSubmit = async (formValue) => {
    if (formValue == null) {
      setVisible(false);
      setSelectedItem(undefined);
      return;
    }
    if (submitLoading) {
      return;
    }

    setSubmitLoading(true);
    try {
      if (selectedItem?.id) {
        const res = await request(`/auth/access_token/${selectedItem.id}`, {
          method: "PUT",
          body: {
            name: formValue.name,
            description: formValue.description,
          },
        });
        if (res?.result === "updated") {
          message.success(formatMessage({ id: "app.message.update.success" }));
          setVisible(false);
          setSelectedItem(undefined);
          run();
          return;
        }
        message.error(res?.error?.reason || formatMessage({ id: "app.message.update.failed" }));
        return;
      }

      const res = await request(`/auth/access_token`, {
        method: "POST",
        body: {
          name: formValue.name,
          description: formValue.description,
        },
      });
      if (res?._id && res?.access_token) {
        message.success(formatMessage({ id: "app.message.create.success" }));
        setVisible(false);
        setSelectedItem(undefined);
        run();
        openCreateTokenResult(res.access_token);
        return;
      }
      message.error(res?.error?.reason || formatMessage({ id: "app.message.create.failed" }));
    } finally {
      setSubmitLoading(false);
    }
  };

  const { data, total } = useMemo(() => formatESSearchResult(value), [value]);

  const columns = [
    {
      title: formatMessage({ id: "table.field.id" }),
      dataIndex: "id",
      render: (text) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Icon type="safety-certificate" style={firstColumnIconStyle} />
          <span>{text || "-"}</span>
        </div>
      ),
    },
    {
      title: formatMessage({ id: "system.security.token.table.name" }),
      dataIndex: "name",
      render: (text) => text || "-",
    },
    {
      title: formatMessage({ id: "system.security.token.table.description" }),
      dataIndex: "description",
      render: (text) => text || "-",
    },
    {
      title: formatMessage({ id: "system.security.token.table.permissions" }),
      dataIndex: "permissions",
      render: (permissions) => (permissions || []).join(", ") || "-",
    },
    {
      title: formatMessage({ id: "system.security.token.table.expire" }),
      dataIndex: "expire_in",
      width: 180,
      render: (expireIn) =>
        Number(expireIn) > 0
          ? moment.unix(expireIn).format("YYYY.MM.DD HH:mm:ss")
          : formatMessage({ id: "system.security.token.never_expire" }),
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      width: 150,
      render: (_, record) => (
        <>
          {canUpdate ? (
            <a
              onClick={() => {
                setSelectedItem(record);
                setVisible(true);
              }}
            >
              {formatMessage({ id: "form.button.edit" })}
            </a>
          ) : null}
          {canUpdate && canDelete ? <Divider type="vertical" /> : null}
          {canDelete ? (
            <Popconfirm
              title={formatMessage({ id: "app.message.confirm.delete" })}
              onConfirm={() => onDelete(record.id)}
            >
              <a>{formatMessage({ id: "form.button.delete" })}</a>
            </Popconfirm>
          ) : null}
        </>
      ),
    },
  ];

  if (!canUpdate && !canDelete) {
    columns.splice(columns.length - 1, 1);
  }

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 15,
        }}
      >
        <div style={{ maxWidth: 500, flex: "1 1 auto" }}>
          <SearchInput
            allowClear
            placeholder={formatMessage({ id: "system.security.token.search.placeholder" })}
            enterButton={formatMessage({ id: "form.button.search" })}
            onSearch={(keyword) => dispatch({ type: "search", value: keyword })}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button icon="redo" onClick={() => dispatch({ type: "refresh" })}>
            {formatMessage({ id: "form.button.refresh" })}
          </Button>
          {canCreate ? (
            <Button
              type="primary"
              icon="plus"
              onClick={() => {
                setSelectedItem(undefined);
                setVisible(true);
              }}
            >
              {formatMessage({ id: "form.button.new" })}
            </Button>
          ) : null}
        </div>
      </div>
      <Table
        size="small"
        loading={loading}
        bordered
        dataSource={data}
        rowKey="id"
        columns={columns}
        pagination={{
          size: "small",
          pageSize: queryParams.size || 20,
          current: Math.floor((queryParams.from || 0) / (queryParams.size || 20)) + 1,
          total: total?.value || total || 0,
          showSizeChanger: true,
          showTotal: (t, range) =>
            formatMessage(
              { id: "system.security.pagination.total" },
              { start: range[0], end: range[1], total: t }
            ),
        }}
        onChange={(pagination) =>
          dispatch({
            type: "pagination",
            current: pagination.current,
            pageSize: pagination.pageSize,
          })
        }
      />
      <Drawer
        width={560}
        onClose={() => {
          if (!submitLoading) {
            setVisible(false);
            setSelectedItem(undefined);
          }
        }}
        visible={visible}
        title={formatMessage({
          id: selectedItem?.id
            ? "system.security.token.drawer.edit.title"
            : "system.security.token.drawer.create.title",
        })}
        destroyOnClose
      >
        <TokenForm
          record={selectedItem}
          onSubmit={onSubmit}
          submitLoading={submitLoading}
        />
      </Drawer>
    </Card>
  );
};

export default Token;
