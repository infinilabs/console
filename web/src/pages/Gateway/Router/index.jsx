import PageHeaderWrapper from "@/components/PageHeaderWrapper";
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
import { useCallback, useMemo } from "react";
import request from "@/utils/request";
import "../list.scss";
import "@/assets/headercontent.scss";
import moment from "moment";

const { Search } = Input;

const RouterList = (props) => {
  const [queryParams, setQueryParams] = React.useState({});
  const [searchValue, setSearchValue] = React.useState("");

  const { loading, error, value } = useFetch(
    `/gateway/router/_search`,
    {
      queryParams: queryParams,
    },
    [queryParams]
  );

  const onDeleteClick = useCallback(
    async (routerID) => {
      const deleteRes = await request(`/gateway/router/${routerID}`, {
        method: "DELETE",
      });
      if (deleteRes && deleteRes.result == "deleted") {
        message.success("delete succeed");
        setQueryParams((params) => {
          return {
            ...params,
          };
        });
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
        title: "Default Flow",
        dataIndex: "default_flow",
        render: (text) => {
          if (!value || !value.flows) {
            return text;
          }
          return (
            <Link to={`/gateway/flow/edit/${text}`}>{value.flows[text]}</Link>
          );
        },
      },
      // {
      //   title: "Rules",
      //   dataIndex: "rules",
      //   render: () => {
      //     return "";
      //   },
      // },
      {
        title: "Tracing Flow",
        dataIndex: "tracing_flow",
        render: (text) => {
          if (!value || !value.flows) {
            return text;
          }
          return (
            <Link to={`/gateway/flow/edit/${text}`}>
              {value.flows[text] || text}
            </Link>
          );
        },
      },
      {
        title: "Last Updated",
        dataIndex: "updated",
        render: (text) => {
          return moment(text).format("YYYY-MM-DD HH:mm:ss");
        },
      },
      {
        title: formatMessage({ id: "table.field.actions" }),
        render: (text, record) => (
          <div>
            <Link to={`/gateway/router/edit/${record.id}`}>
              {formatMessage({ id: "form.button.edit" })}
            </Link>
            <Divider type="vertical" />
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => {
                onDeleteClick(record.id);
              }}
            >
              <a>{formatMessage({ id: "form.button.delete" })}</a>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [value]
  );
  const { data: routers, total } = React.useMemo(() => {
    if (!value) {
      return [];
    }
    return formatESSearchResult(value);
  }, [value]);

  const handleTableChange = (pagination, filters, sorter, extra) => {
    const { pageSize, current } = pagination;
    setQueryParams({
      from: (current - 1) * pageSize,
      size: pageSize,
      name: searchValue,
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
    <PageHeaderWrapper>
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
            <Button
              type="primary"
              icon="plus"
              onClick={() => router.push(`/gateway/router/new`)}
            >
              {formatMessage({ id: "gateway.instance.btn.new" })}
            </Button>
          </div>
        </div>

        <Table
          size={"small"}
          loading={false}
          bordered
          dataSource={routers}
          rowKey="id"
          pagination={{
            size: "small",
            pageSize: 20,
            total: total?.value || total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          columns={columns}
          onChange={handleTableChange}
        />
      </Card>
    </PageHeaderWrapper>
  );
};

export default RouterList;
