import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import {
  Tabs,
  Card,
  Table,
  Empty,
  Popconfirm,
  Divider,
  Form,
  Row,
  Col,
  Button,
  Input,
  message,
  Drawer,
} from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { useGlobal } from "@/layouts/GlobalContext";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import router from "umi/router";
import Link from "umi/link";
import { useCallback, useMemo, useState } from "react";
import request from "@/utils/request";
import "../list.scss";
import "@/assets/headercontent.scss";
import moment from "moment";
import { hasAuthority } from "@/utils/authority";
const taskStatus = {
  STARTING: "STARTING",
  STARTED: "STARTED",
  CANCELLED: "CANCELLED",
  STOPPING: "STOPPING",
  STOPPED: "STOPPED",
  FAILED: "FAILED",
  FINISHED: "FINISHED",
};

const { TabPane } = Tabs;

const TaskList = (props) => {
  const [queryParams, setQueryParams] = React.useState({});

  const { match } = props;
  const { loading, error, value } = useFetch(
    `/instance/${match.params.instance_id}/_proxy?method=GET&path=/pipeline/tasks/`,
    {
      method: "POST",
      queryParams: queryParams,
    },
    [queryParams]
  );
  const taskList = useMemo(() => {
    if (!value || value.error) {
      return [];
    }
    return Object.keys(value).map((k) => {
      return {
        name: k,
        ...value[k],
      };
    });
  }, [value]);

  const onStartClick = async (taskName) => {
    const res = request(
      `/instance/${match.params.instance_id}/_proxy?method=POST&path=/pipeline/task/${taskName}/_start`,
      {
        method: "POST",
      }
    );
    if (res) {
      setQueryParams({
        ts: new Date().valueOf(),
      });
    }
  };

  const onStopClick = async (taskName) => {
    const res = request(
      `/instance/${match.params.instance_id}/_proxy?method=POST&path=/pipeline/task/${taskName}/_stop`,
      {
        method: "POST",
      }
    );
    if (res) {
      setQueryParams({
        ts: new Date().valueOf(),
      });
    }
  };

  const renderConfirmTitle = (id) => (
    <span style={{ whiteSpace: "nowrap" }}>
      {formatMessage({ id })}
    </span>
  );

  const columns = useMemo(
    () => [
      {
        title: formatMessage({ id: "gateway.task.column.name" }),
        dataIndex: "name",
      },
      {
        title: formatMessage({ id: "gateway.task.column.state" }),
        dataIndex: "state",
        render: (text) =>
          formatMessage({
            id: `gateway.task.state.${String(text || "").toLowerCase()}`,
            defaultMessage: text,
          }),
      },
      {
        title: formatMessage({ id: "gateway.task.column.start_time" }),
        dataIndex: "start_time",
        render: (text) => {
          return moment(text).format("YYYY-MM-DD HH:mm:ss");
        },
      },
      {
        title: formatMessage({ id: "gateway.task.column.end_time" }),
        dataIndex: "end_time",
        render: (text) => {
          return text ? moment(text).format("YYYY-MM-DD HH:mm:ss") : text;
        },
      },
      {
        title: formatMessage({ id: "table.field.actions" }),
        render: (text, record) => {
          if (!hasAuthority("gateway.instance:all")) {
            return null;
          }
          return (
            <div>
              {record.state === taskStatus.STOPPED ? (
                <Popconfirm
                  title={renderConfirmTitle("gateway.task.confirm.start")}
                  onConfirm={() => onStartClick(record.name)}
                >
                  <a>{formatMessage({ id: "form.button.start" })}</a>
                </Popconfirm>
              ) : null}

              {/* <Divider type="vertical" /> */}
              {record.state !== taskStatus.STOPPED ? (
                <Popconfirm
                  title={renderConfirmTitle("gateway.task.confirm.stop")}
                  onConfirm={() => onStopClick(record.name)}
                >
                  <a>{formatMessage({ id: "form.button.stop" })}</a>
                </Popconfirm>
              ) : null}
            </div>
          );
        },
      },
    ],

    [value]
  );

  const handleTableChange = (pagination, filters, sorter, extra) => {
    const { pageSize, current } = pagination;
    setQueryParams({
      from: (current - 1) * pageSize,
      size: pageSize,
      current,
    });
  };
  const [state, setState] = useState({
    selectedRowKeys: [],
    selectedStartKeys: [],
    selectedStopKeys: [],
  });
  const onSelectChange = useCallback(
    (selectedRowKeys) => {
      const selectedStartKeys = [];
      const selectedStopKeys = [];
      selectedRowKeys.forEach((key) => {
        if (value[key]?.state === taskStatus.STOPPED) {
          selectedStartKeys.push(key);
        } else if (value[key]?.state !== taskStatus.STOPPED) {
          selectedStopKeys.push(key);
        }
      });
      setState((st) => {
        return {
          ...st,
          selectedStartKeys,
          selectedStopKeys,
          selectedRowKeys,
        };
      });
    },
    [value]
  );

  const onBatchStartClick = useCallback(async () => {
    state.selectedStartKeys.forEach(async (key) => {
      const res = await request(
        `/instance/${match.params.instance_id}/_proxy?method=POST&path=/pipeline/task/${key}/_start`,
        {
          method: "POST",
        }
      );
    });
    setQueryParams({
      ts: new Date().valueOf(),
    });
    setState((st) => {
      return {
        ...st,
        selectedRowKeys: [],
        selectedStartKeys: [],
        selectedStopKeys: [],
      };
    });
  }, [state.selectedStartKeys]);

  const onBatchStopClick = useCallback(async () => {
    state.selectedStopKeys.forEach(async (key) => {
      const res = await request(
        `/instance/${match.params.instance_id}/_proxy?method=POST&path=/pipeline/task/${key}/_stop`,
        {
          method: "POST",
        }
      );
    });
    setQueryParams({
      ts: new Date().valueOf(),
    });
    setState((st) => {
      return {
        ...st,
        selectedRowKeys: [],
        selectedStartKeys: [],
        selectedStopKeys: [],
      };
    });
  }, [state.selectedStopKeys]);

  return (
    <PageHeaderWrapper>
      <Card>
        <div
          style={{ marginBottom: 15, display: "flex", justifyContent: "end" }}
        >
          {hasAuthority("gateway.instance:all") ? (
            <>
              <Button
                type="primary"
                onClick={onBatchStartClick}
                disabled={state.selectedStartKeys.length == 0}
              >
                {formatMessage({ id: "form.button.start" })}
              </Button>
              <Button
                onClick={onBatchStopClick}
                style={{ marginLeft: 10 }}
                disabled={state.selectedStopKeys.length == 0}
              >
                {formatMessage({ id: "form.button.stop" })}
              </Button>
            </>
          ) : null}
          <Button
            icon="redo"
            style={{ marginLeft: 10 }}
            onClick={() => setQueryParams({ ts: new Date().valueOf() })}
          >
            {formatMessage({ id: "form.button.refresh" })}
          </Button>
          <Button
            type="primary"
            onClick={() => props.history.go(-1)}
            style={{ marginLeft: 10 }}
          >
            {formatMessage({ id: "form.button.goback" })}
          </Button>
        </div>
        <Table
          size={"small"}
          loading={false}
          bordered
          dataSource={taskList}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={formatMessage({ id: "gateway.task.empty" })}
              />
            ),
          }}
          rowKey={(row) => row.name}
          rowSelection={{
            selectedRowKeys: state.selectedRowKeys,
            onChange: onSelectChange,
          }}
          pagination={
            taskList.length > 0
              ? {
                  size: "small",
                  pageSize: 20,
                  total: taskList.length,
                  showSizeChanger: true,
                  showTotal: (total, range) =>
                    formatMessage(
                      { id: "system.security.pagination.total" },
                      { start: range[0], end: range[1], total }
                    ),
                }
              : false
          }
          columns={columns}
          onChange={handleTableChange}
        />
      </Card>
    </PageHeaderWrapper>
  );
};

export default TaskList;
