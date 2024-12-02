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
import "./trace_template.scss";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { useGlobal } from "@/layouts/GlobalContext";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import router from "umi/router";
import Link from "umi/link";
import { useCallback } from "react";
import request from "@/utils/request";

export default ({}) => {
  const { selectedCluster } = useGlobal();
  const handleDeleteClick = useCallback(
    async (id) => {
      const res = await request(
        `${ESPrefix}/${selectedCluster.id}/trace_template/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!res || res.error) {
        return false;
      }
      message.success("delete succeed");
      setQueryParams({
        ...queryParams,
        t: new Date().valueOf(),
      });
    },
    [selectedCluster]
  );
  const columns = [
    {
      title: "Template Name",
      dataIndex: "name",
    },
    {
      title: "Meta Index",
      dataIndex: "meta_index",
    },
    {
      title: "Trace Field",
      dataIndex: "trace_field",
    },
    {
      title: "Timestamp Field",
      dataIndex: "timestamp_field",
    },
    {
      title: "Agg Field",
      dataIndex: "agg_field",
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => (
        <div>
          <Link to={`/data/search_flow/edit/${record.id}`}>Edit</Link>
          <Divider type="vertical" />
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDeleteClick(record.id)}
          >
            <a>Delete</a>
          </Popconfirm>
        </div>
      ),
    },
  ];
  const [queryParams, setQueryParams] = React.useState({});

  const { loading, error, value } = useFetch(
    `${ESPrefix}/${selectedCluster.id}/trace_template`,
    {
      queryParams: queryParams,
    },
    [selectedCluster, queryParams]
  );
  const { data: templates, total } = React.useMemo(() => {
    if (!value) {
      return [];
    }
    return formatESSearchResult(value);
  }, [value]);

  const nameRef = React.useRef();
  const onSearchClick = () => {
    setQueryParams({
      ...queryParams,
      name: nameRef.current?.state.value,
    });
  };
  return (
    <PageHeaderWrapper>
      <Card>
        <div>
          <div>
            <div className="form-row">
              <div className="label-col">
                <label>Template Name: </label>
              </div>
              <div className="col input-col">
                <Input
                  placeholder="please input search flow name"
                  ref={nameRef}
                />
              </div>
              <div className="btn-col">
                <Button type="primary" icon="search" onClick={onSearchClick}>
                  {formatMessage({ id: "form.button.search" })}
                </Button>
              </div>
              <div className="new">
                <Button
                  type="primary"
                  icon="plus"
                  onClick={() => router.push(`/data/search_flow/new`)}
                >
                  新建
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Table
          size={"small"}
          loading={loading}
          bordered
          dataSource={templates}
          rowKey="id"
          pagination={{
            size: "small",
            pageSize: 20,
            total: total?.value || total,
          }}
          columns={columns}
        />
      </Card>
    </PageHeaderWrapper>
  );
};
