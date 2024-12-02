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

const UserList = (props) => {
  const [queryParams, setQueryParams] = React.useState({});
  const [searchValue, setSearchValue] = React.useState("");

  const { loading, error, value } = useFetch(
    `/user/_search`,
    {
      queryParams: queryParams,
    },
    [queryParams]
  );
  const [isLoading, setIsLoading] = React.useState(loading);
  const onDeleteClick = useCallback(
    async (userID) => {
      const deleteRes = await request(`/user/${userID}`, {
        method: "DELETE",
      });
      if (deleteRes && deleteRes.result == "deleted") {
        message.success(
          formatMessage({
            id: "app.message.delete.success",
          })
        );
        setIsLoading(true);
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
        title: "Nickname",
        dataIndex: "nick_name",
      },
      {
        title: "Roles",
        dataIndex: "roles",
        render: (val) => {
          return (val || []).map((role) => role.name).join(",");
        },
      },
      {
        title: "Phone",
        dataIndex: "phone",
      },
      {
        title: "Email",
        dataIndex: "email",
      },
      {
        title: "Tags",
        dataIndex: "tags",
        render: (text) => {
          return text;
        },
      },
      {
        title: formatMessage({ id: "table.field.actions" }),
        render: (text, record) => (
          <div>
            {hasAuthority("system.security:all") ? (
              <>
                <Link
                  key="permission"
                  to={`/system/security/user/edit/${record.id}`}
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
                <Divider key="d3" type="vertical" />
                <Link
                  key="reset_password"
                  to={`/system/security/user/password/${record.id}`}
                >
                  Reset Password
                </Link>
              </>
            ) : null}
          </div>
        ),
      },
    ],

    [value]
  );
  const { data: users, total } = React.useMemo(() => {
    setIsLoading(loading);
    if (!value) {
      return {
        data: [],
        total: 0,
      };
    }
    return formatESSearchResult(value);
  }, [value, loading]);

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
            <Button
              type="primary"
              icon="plus"
              onClick={() => router.push(`/system/security/user/new`)}
            >
              {formatMessage({ id: "gateway.instance.btn.new" })}
            </Button>
          ) : null}
        </div>
      </div>
      <Table
        size={"small"}
        loading={isLoading}
        bordered
        dataSource={users}
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

export default UserList;
