import {
  Card,
  Table,
  Popconfirm,
  Divider,
  Form,
  Row,
  Col,
  Button,
  Input,
  message,
  Menu,
  Dropdown,
} from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { useGlobal } from "@/layouts/GlobalContext";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import router from "umi/router";
import Link from "umi/link";
import { useCallback, useEffect, useMemo } from "react";
import request from "@/utils/request";
import "@/pages/Gateway/list.scss";
import "@/assets/headercontent.scss";
import moment from "moment";
import { formatter } from "@/lib/format";
import { hasAuthority } from "@/utils/authority";

const { Search } = Input;

const RoleList = (props) => {
  const [queryParams, setQueryParams] = React.useState({});
  const [searchValue, setSearchValue] = React.useState("");

  const { loading, error, value } = useFetch(
    `/role/_search`,
    {
      queryParams: queryParams,
    },
    [queryParams]
  );
  const onDeleteClick = useCallback(
    async (roleID) => {
      const deleteRes = await request(`/role/${roleID}`, {
        method: "DELETE",
      });
      if (deleteRes && deleteRes.result == "deleted") {
        message.success(
          formatMessage({
            id: "app.message.delete.success",
          })
        );
        setTimeout(() => {
          onRefreshClick();
        }, 1000);
      }
    },
    [setQueryParams]
  );
  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
      },
      {
        title: "Type",
        dataIndex: "type",
      },
      {
        title: "Builtin",
        dataIndex: "builtin",
        render: (val) => {
          return val === true ? "true" : "false";
        },
      },
      {
        title: "Description",
        dataIndex: "description",
      },
      {
        title: formatMessage({ id: "table.field.actions" }),
        render: (text, record) => (
          <div>
            {hasAuthority("system.security:all") && record.builtin === false ? (
              <>
                <Link
                  key="edit"
                  to={
                    record.type == "platform"
                      ? `/system/security/role/platform/edit/${record.id}`
                      : `/system/security/role/data/edit/${record.id}`
                  }
                >
                  Edit
                </Link>
                <Divider key="d2" type="vertical" />
                <Popconfirm
                  title="Sure to delete?"
                  onConfirm={() => onDeleteClick(record.id)}
                >
                  <a>Delete</a>
                </Popconfirm>
              </>
            ) : null}
          </div>
        ),
      },
    ],

    [value]
  );
  const { data: roles, total } = React.useMemo(() => {
    if (!value || value.error) {
      return {
        data: [],
        total: 0,
      };
    }
    return formatESSearchResult(value);
  }, [value]);

  const handleTableChange = (pagination, filters, sorter, extra) => {
    const { pageSize, current } = pagination;
    setQueryParams({
      from: (current - 1) * pageSize,
      size: pageSize,
      keyword: searchValue,
      current,
    });
  };

  React.useMemo(() => {
    setQueryParams({
      ...queryParams,
      keyword: searchValue,
    });
  }, [searchValue]);

  const onSearchClick = (val) => {
    setSearchValue(val);
  };

  const onRefreshClick = () => {
    setQueryParams({
      ...queryParams,
    });
  };

  const handleMenuClick = (e) => {
    switch (e.key) {
      case "console":
        router.push(`/system/security/role/platform/new`);
        return;
      case "data":
        router.push(`/system/security/role/data/new`);
        return;
    }
  };
  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="console">Add Platform Role</Menu.Item>
      <Menu.Item key="data">Add Data Role</Menu.Item>
    </Menu>
  );

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
          <Search
            allowClear
            placeholder="Type keyword to search"
            enterButton="Search"
            onSearch={(value) => {
              onSearchClick(value);
            }}
            onChange={(e) => {
              onSearchClick(e.currentTarget.value);
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
          <Button
            icon="redo"
            onClick={() => {
              onRefreshClick();
            }}
          >
            {formatMessage({ id: "form.button.refresh" })}
          </Button>
          {hasAuthority("system.security:all") ? (
            <Dropdown overlay={menu}>
              <Button
                type="primary"
                icon="plus"
                // onClick={() => router.push(`/system/role/platform/new`)}
              >
                {formatMessage({ id: "gateway.instance.btn.new" })}
              </Button>
            </Dropdown>
          ) : null}
        </div>
      </div>

      <Table
        size={"small"}
        loading={loading}
        bordered
        dataSource={roles}
        rowKey={"id"}
        pagination={{
          size: "small",
          pageSize: queryParams.size || 20,
          total: total?.value || total,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        columns={columns}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default RoleList;
