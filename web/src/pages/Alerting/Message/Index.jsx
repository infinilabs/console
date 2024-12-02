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
  Select,
  Input,
  message,
  Tag,
  Drawer,
  Icon,
  Modal,
  Dropdown,
  Menu,
  Tooltip,
} from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { useGlobalClusters } from "@/layouts/GlobalContext";
import router from "umi/router";
import Link from "umi/link";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import request from "@/utils/request";
import moment from "moment";
import { formatter } from "@/lib/format";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { filterSearchValue, sorter, formatUtcTimeToLocal } from "@/utils/utils";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import { MonitorDatePicker } from "@/components/infini/MonitorDatePicker";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import "./Index.scss";
import { cloneDeep, endsWith } from "lodash";
import MessageDetail from "./components/MessageDetail";
import {
  PriorityColor,
  MessageStautsColor,
  PriorityToIconType,
} from "../utils/constants";
import IgnoreModal from "./components/IgnoreModal";
import { hasAuthority } from "@/utils/authority";
import ClusterName from "@/pages/System/Cluster/components/ClusterName";
import Statistic, { PriorityIconText } from "../components/Statistic";
import Mute from "@/components/Icons/Mute";
import EventMessageStatus from "./components/EventMessageStatus";
import WidgetLoader from "@/pages/DataManagement/View/WidgetLoader";

import DatePicker from "@/common/src/DatePicker";
import { getTimezone } from "@/utils/utils";
import { getLocale } from "umi/locale";

const { Search } = Input;
const { Option } = Select;

const Index = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const [searchValue, setSearchValue] = React.useState("");
  const [messageDetail, setMessageDetail] = useState({});
  const [loading, setLoading] = React.useState(false);
  const [dataSource, setDataSource] = useState({ data: [], total: 0 });
  const [stats, setStats] = useState({});
  const [state, setState] = useState({
    categories: [],
    tags: [],
  });

  const [refresh, setRefresh] = useState({ isRefreshPaused: false });
  const [timeZone, setTimeZone] = useState(() => getTimezone());

  const initialQueryParams = {
    from: 0,
    size: 10,
    // status: "alerting",
    start_time: "now-7d",
    end_time: "now",
    ...param,
  };

  const alertReducer = (queryParams, action) => {
    switch (action.type) {
      case "priority":
        return {
          ...queryParams,
          priority: action.value,
        };
      case "status":
        return {
          ...queryParams,
          status: action.value,
        };
      case "timeChange":
        return {
          ...queryParams,
          ...action.value,
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
      case "category":
        return {
          ...queryParams,
          category: action.value,
        };
      case "tags":
        return {
          ...queryParams,
          tags: action.value,
        };
    }
    return queryParams;
  };
  const [queryParams, dispatch] = React.useReducer(
    alertReducer,
    initialQueryParams
  );

  const onRefreshClick = () => {
    dispatch({ type: "refresh" });
  };

  const ignoreTextInput = useRef(null);
  const [ignoreState, setIgnoreState] = useState({
    items: [],
    visible: false,
    hasError: false,
  });
  const onIgnoreCancel = () => {
    setIgnoreState({ ...ignoreState, visible: false, hasError: false });
  };
  const onIgnoreOk = async () => {
    const ignoredReason = ignoreTextInput.current.state.value;
    if (!ignoredReason || ignoredReason.length == 0) {
      ignoreTextInput.current.focus();
      setIgnoreState({ ...ignoreState, hasError: true });
      return;
    } else {
      const res = await request(`alerting/message/_ignore`, {
        method: "POST",
        body: {
          messages: ignoreState.items,
          ignored_reason: ignoredReason,
        },
      });
      if (res && res.result == "updated") {
        message.success(
          formatMessage({
            id: "app.message.ignored.success",
          })
        );

        setIgnoreState({ ...ignoreState, visible: false });
        setTimeout(() => {
          setMessageDetail({});
          onRefreshClick();
        }, 1000);
      } else {
        console.log("Ignored failed,", res);
        message.error(
          formatMessage({
            id: "app.message.ignored.failed",
          })
        );
      }
    }
  };

  const showIgnoreConfirm = (items) => {
    setIgnoreState({ ...ignoreState, items: items, visible: true });
  };
  const clusterM = useGlobalClusters();
  const generateMenu = (onMenuClick, status) => {
    return (
      <Menu onClick={onMenuClick}>
        <Menu.Item
          key="ignore"
          disabled={!status || status == "alerting" ? false : true}
        >
          <Icon component={Mute} style={{ color: "rgb(187, 187, 187)" }} />
          <span style={{ color: "rgba(102,102,102,1)" }}>
            {formatMessage({ id: "form.button.ignore" })}
          </span>
        </Menu.Item>
        <Menu.Item
          key="reset"
          disabled={!status || status == "ignored" ? false : true}
        >
          <Icon type="reload" style={{ color: "rgb(187, 187, 187)" }} />
          <span style={{ color: "rgba(102,102,102,1)" }}>
            {formatMessage({ id: "form.button.reset" })}
          </span>
        </Menu.Item>
      </Menu>
    );
  };

  const columns = [
    // {
    //   title: formatMessage({ id: "alert.rule.table.columnns.cluster" }),
    //   dataIndex: "resource_name",
    //   render: (val, record) => {
    //     return (
    //       <ClusterName
    //         name={val}
    //         distribution={clusterM[record.resource_id]?.distribution}
    //         id={record.resource_id}
    //       />
    //     );
    //   },
    // },
    {
      title: formatMessage({ id: "alert.message.table.priority" }),
      dataIndex: "priority",
      render: (text, record) => {
        const Com = PriorityToIconType[text];
        if (!Com) {
          return text;
        }
        return <PriorityIconText priority={text} />;
      },
    },
    {
      title: formatMessage({ id: "alert.message.table.title" }),
      dataIndex: "title",
      render: (text, record) => {
        return (
          <a
            style={{
              maxWidth: 360,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              display: "block",
              overflow: "hidden",
            }}
            onClick={() => setMessageDetail(record)}
          >
            {text}
          </a>
        );
      },
    },
    {
      title: formatMessage({ id: "alert.message.table.category" }),
      dataIndex: "category",
      width: 80,
      render: (val, record) => {
        return <Tag style={{ color: "rgb(0, 127, 255)" }}>{val}</Tag>;
      },
    },
    // {
    //   title: formatMessage({ id: "alert.message.table.tags" }),
    //   dataIndex: "tags",
    //   render: (val, record)=>{
    //     return (val || []).map(item=>{
    //       return <Tag style={{color:"rgb(0, 127, 255)"}}>{item}</Tag>
    //     })
    //   }
    // },
    {
      title: formatMessage({ id: "alert.message.table.created" }),
      dataIndex: "created",
      width: 180,
      render: (text, record) => (
        <span title={text}>{formatUtcTimeToLocal(text)}</span>
      ),
    },
    {
      title: formatMessage({ id: "alert.message.table.duration" }),
      dataIndex: "duration",
      render: (text, record) => moment.duration(text).humanize(),
    },
    {
      title: formatMessage({ id: "alert.message.table.status" }),
      dataIndex: "status",
      width: 80,
      render: (text, record) => {
        return <EventMessageStatus record={record} />;
        // <HealthStatusView status={MessageStautsColor[text]} label={text} />
      },
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      align: "center",
      render: (text, record) => {
        if (!hasAuthority("alerting.message:all")) {
          return null;
        }
        const onSingleMenuClick = ({ key }) => {
          switch (key) {
            case "ignore":
              showIgnoreConfirm([{ id: record.id, rule_id: record.rule_id }]);
              break;
            case "reset":
              resetMessage([
                { id: record.id, rule_id: record.rule_id, is_reset: true },
              ]);
              break;
          }
        };
        const menu = generateMenu(onSingleMenuClick, record.status);
        return (
          <div>
            <Dropdown overlay={menu}>
              <a style={{ fontSize: "1.4em" }}>
                <Icon type="ellipsis" />
              </a>
            </Dropdown>

            {/*<div style={{ whiteSpace: 'nowrap'}}>
          <a onClick={() => setMessageDetail(record)}>
            {formatMessage({ id: "form.button.detail" })}
          </a>
          {hasAuthority("alerting.message:all") ? (
            <>
              <Divider type="vertical" />
              <a
                disabled={record?.status == "alerting" ? "" : "disabled"}
                onClick={() => {
                  showIgnoreConfirm([
                    { id: record.id, rule_id: record.rule_id },
                  ]);
                }}
              >
                {formatMessage({ id: "form.button.ignore" })}
              </a>
            </>
          ) : null} */}
          </div>
        );
      },
    },
  ];

  const onTimeChange = ({ start, end }) => {
    dispatch({
      type: "timeChange",
      value: { start_time: start, end_time: end },
    });
  };

  const fetchMessages = (queryParams) => {
    setLoading(true);
    let params = queryParams;
    if (queryParams?.start_time && queryParams.end_time) {
      const bounds = calculateBounds({
        from: queryParams?.start_time,
        to: queryParams.end_time,
      });
      params = {
        ...queryParams,
        min: bounds.min.valueOf(),
        max: bounds.max.valueOf(),
      };
    }

    const fetchData = async () => {
      let url = `/alerting/message/_search`;
      const res = await request(url, {
        method: "GET",
        queryParams: params,
      });
      if (res && !res.error) {
        let { data, total, aggregations } = formatESSearchResult(res);
        setDataSource({ data, total, aggregations });
      }
      setLoading(false);
    };
    fetchData();
  };

  const fetchMessageStats = () => {
    const fetchData = async () => {
      let url = `/alerting/message/_stats`;
      const res = await request(url, {
        method: "GET",
      });
      if (res && res.alert && res.alert.current && !res.error) {
        setStats(res.alert.current);
        setState({
          categories: res.categories || [],
          tags: res.tags || [],
        });
      }
    };
    fetchData();
  };

  useEffect(() => {
    setParam({ ...param, ...queryParams });
    fetchMessages(queryParams);

    fetchMessageStats(queryParams);
  }, [queryParams]);

  const [selectedRows, setSelectedRows] = useState({
    rowKeys: [],
    rows: [],
  });
  const onSelectChange = (selectedRowKeys, selectedRows) => {
    let rows = selectedRows.map((item) => {
      return {
        id: item.id,
        rule_id: item.rule_id,
      };
    });
    setSelectedRows({ rowKeys: selectedRowKeys, rows: rows });
  };

  const rowSelection = {
    selectedRowKeys: selectedRows.rowKeys,
    onChange: onSelectChange,
  };

  const onPriorityFilter = (value) => {
    dispatch({ type: "priority", value: value });
    dispatch({ type: "status", value: "alerting" });
  };
  const onStatusFilter = (value) => {
    dispatch({ type: "status", value: value });
    dispatch({ type: "priority", value: undefined });
  };

  const DrawerTitle = ({ id, ruleID, title, status }) => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          wordBreak: "break-all",
          gap: 10,
        }}
      >
        <div>{title}</div>
        <div style={{ paddingRight: 30 }}>
          <Link to={`/alerting/message/${id}`}>
            <Button type="primary">
              {formatMessage({ id: "form.button.detail" })}
            </Button>
          </Link>
        </div>
      </div>
    );
  };
  const resetMessage = async (items) => {
    const res = await request(`alerting/message/_ignore`, {
      method: "POST",
      body: {
        messages: items,
        is_reset: true,
      },
    });
    if (res && res.result == "updated") {
      message.success("Reset succeeded");
      setTimeout(() => {
        onRefreshClick();
      }, 1000);
    }
  };
  const onBatchMenuClick = ({ key }) => {
    if (selectedRows.rowKeys.length == 0) {
      message.warn(
        formatMessage({
          id: "app.message.warning.table.select-row",
        })
      );
      return;
    }
    switch (key) {
      case "ignore":
        showIgnoreConfirm(selectedRows.rows);
        break;
      case "reset":
        resetMessage(selectedRows.rows);
        break;
    }
  };

  const batchMenu = generateMenu(onBatchMenuClick);

  const widgetQueryParams = useMemo(() => {
    const newQueryParams = cloneDeep(queryParams);
    delete newQueryParams.from;
    delete newQueryParams.size;
    delete newQueryParams._t;
    delete newQueryParams.start_time;
    delete newQueryParams.end_time;
    return newQueryParams;
  }, [JSON.stringify(queryParams)]);

  const { minUpdated, maxUpdated } = useMemo(() => {
    if (!dataSource.aggregations) {
      return { minUpdated: "", maxUpdated: "" };
    }
    return {
      minUpdated: moment(dataSource.aggregations.min_updated?.value),
      maxUpdated: moment(dataSource.aggregations.max_updated?.value),
    };
  }, [dataSource.aggregations]);

  const filterPriorityAndStatus = (params) => {
    dispatch({
      type: "timeChange",
      value: {
        start_time: "",
        end_time: "",
      },
    });
    if (params.type === "priority") {
      dispatch({
        type: "status",
        value: "alerting",
      });
    } else {
      dispatch({
        type: "priority",
        value: undefined,
      });
    }
    dispatch(params);
  };

  return (
    <PageHeaderWrapper>
      <Card>
        <div style={{ display: "flex", gap: "10px", marginBottom: 20 }}>
          <div
            style={{
              height: 180,
              border: "1px solid rgb(235, 235, 235)",
              width: "calc(50% - 5px)",
            }}
          >
            <Statistic stats={stats} dispatch={filterPriorityAndStatus} />
          </div>
          <div style={{ width: "calc(50% - 5px)" }} className="alert-heatmap">
            <Card
              size="small"
              title={formatMessage({
                id: "alert.rule.detail.title.alert_heatmap",
              })}
            >
              <WidgetLoader
                id="cji1sc28go5i051pl1i0"
                range={{
                  from: "now-6M",
                  to: "now",
                }}
              />
            </Card>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 15,
          }}
        >
          <div
            style={{
              display: "flex",
              flexFlow: "column",
              gap: 10,
              width: 800,
            }}
          >
            <div className="filters">
              <Select
                allowClear
                showSearch
                style={{ width: 120 }}
                placeholder={"category"}
                defaultValue={queryParams?.category}
                value={queryParams?.category}
                onChange={(value) => {
                  dispatch({ type: "category", value: value });
                }}
              >
                {state.categories.map((item) => {
                  return (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  );
                })}
              </Select>
              <Select
                allowClear
                showSearch
                style={{ width: 120 }}
                placeholder={"tags"}
                defaultValue={queryParams?.tags}
                value={queryParams?.tags}
                onChange={(value) => {
                  dispatch({ type: "tags", value: value });
                }}
              >
                {state.tags.map((item) => {
                  return (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  );
                })}
              </Select>
              <Select
                allowClear
                showSearch
                style={{ width: 150 }}
                placeholder={"priority"}
                defaultValue={queryParams?.priority}
                value={queryParams?.priority}
                onChange={(value) => {
                  dispatch({ type: "priority", value: value });
                }}
              >
                {Object.keys(PriorityColor).map((item) => {
                  return (
                    <Option key={item} value={item}>
                      <PriorityIconText priority={item} />
                    </Option>
                  );
                })}
              </Select>
              <Select
                allowClear
                showSearch
                style={{ width: 150 }}
                placeholder={"status"}
                value={queryParams?.status}
                onChange={(value) => {
                  dispatch({ type: "status", value: value });
                }}
              >
                <Option value="alerting">alerting</Option>
                <Option value="ignored">ignored</Option>
                <Option value="recovered">recovered</Option>
              </Select>

              <div style={{ flexGrow: 0 }}>
                <DatePicker
                  locale={getLocale()}
                  start={param?.start_time}
                  end={param?.end_time}
                  onRangeChange={onTimeChange}
                  {...refresh}
                  onRefreshChange={setRefresh}
                  onRefresh={onTimeChange}
                  timeZone={timeZone}
                  onTimeZoneChange={setTimeZone}
                  recentlyUsedRangesKey={'alerting-message'}
                />
              </div>
            </div>
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
            {hasAuthority("alerting.message:all") ? (
              <Dropdown overlay={batchMenu}>
                <Button type="primary">
                  {formatMessage({ id: "form.button.batch_actions" })}{" "}
                  <Icon type="down" />
                </Button>
              </Dropdown>
            ) : null}
          </div>
        </div>
        <div
          style={{
            width: "100%",
            height: 140,
            border: "1px solid rgb(232, 232, 232)",
            borderRadius: 2,
            marginBottom: 15,
          }}
        >
          <WidgetLoader
            id="cji1ttq8go5i051pl1t0"
            range={{
              from: minUpdated,
              to: maxUpdated,
            }}
            queryParams={widgetQueryParams}
          />
        </div>
        <Table
          size={"small"}
          loading={loading}
          bordered={false}
          dataSource={dataSource?.data}
          rowKey={"id"}
          pagination={{
            size: "small",
            pageSize: queryParams.size,
            total: dataSource?.total?.value || dataSource?.total,
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
          columns={columns}
          rowSelection={rowSelection}
        />
      </Card>
      <Drawer
        title={
          <DrawerTitle
            id={messageDetail.id}
            ruleID={messageDetail.rule_id}
            title={messageDetail.title}
            status={messageDetail.status}
          />
        }
        width={800}
        placement="right"
        closable={true}
        onClose={() => setMessageDetail({})}
        visible={!!messageDetail.id}
        destroyOnClose={true}
      >
        <MessageDetail messageID={messageDetail.id} />
      </Drawer>

      <IgnoreModal
        ref={ignoreTextInput}
        ignoreState={ignoreState}
        onCancel={onIgnoreCancel}
        onOk={onIgnoreOk}
      />
    </PageHeaderWrapper>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Index {...props} />
    </QueryParamProvider>
  );
};
