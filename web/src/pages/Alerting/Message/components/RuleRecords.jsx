import { Table, Button, Divider, Tag, Icon, Select } from "antd";
import { formatMessage } from "umi/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import Link from "umi/link";
import request from "@/utils/request";
import { formatUtcTimeToLocal, firstUpperCase } from "@/utils/utils";
import { HealthStatusView } from "@/components/infini/health_status_view";
import {
  MessageStautsColor,
  PriorityColor,
  RuleStautsColor,
} from "../../utils/constants";
import { MonitorDatePicker } from "@/components/infini/MonitorDatePicker";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import MessageCard from "./MessageCard";
import { PriorityIconText } from "../../components/Statistic";
import WidgetLoader from "@/pages/DataManagement/View/WidgetLoader";
const Option = Select.Option;

const RuleRecords = ({ ruleID, timeRange, showAertMetric = false, refresh }) => {
  if (!ruleID || !timeRange.min) {
    return null;
  }
  const [dataSource, setDataSource] = useState({ data: [], total: 0 });
  const [loading, setLoading] = React.useState(true);

  const bounds = calculateBounds({
    from: timeRange.min || "now-1d",
    to: timeRange.max || "now",
  });
  const initialQueryParams = {
    from: 0,
    size: 10,
    rule_id: ruleID,
    min: bounds.min.valueOf(),
    max: bounds.max.valueOf(),
  };

  const alertReducer = (queryParams, action) => {
    switch (action.type) {
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
      case "priority":
        return {
          ...queryParams,
          priority: action.value,
        };
      case "state":
        return {
          ...queryParams,
          state: action.value,
        };
      case "refresh":
        return {
          ...queryParams,
          _t: new Date().getTime(),
        };
    }
    return queryParams;
  };
  const onRefreshClick = () => {
    dispatch({ type: "refresh" });
  };
  const [queryParams, dispatch] = React.useReducer(
    alertReducer,
    initialQueryParams
  );

  const columns = [
    {
      title: formatMessage({ id: "alert.message.table.execution_time" }),
      dataIndex: "created",
      render: (text, record) => (
        <span title={text}>{formatUtcTimeToLocal(text)}</span>
      ),
    },
    {
      title: formatMessage({ id: "alert.message.table.execution_status" }),
      dataIndex: "state",
      render: (text, record) => {
        return (
          <div style={{ display: "flex", gap: 5 }}>
            <Tag
              style={{
                backgroundColor: MessageStautsColor[text],
                color: "#fff",
                border: "none",
              }}
            >
              {firstUpperCase(text)}
            </Tag>
            {text != "ok" ? (
              <PriorityIconText priority={record.priority} />
            ) : null}
          </div>
        );
      },
    },

    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => (
        <Link to={`/alerting/alert/${record.id}`}>
          {formatMessage({ id: "form.button.detail" })}
        </Link>
      ),
    },
  ];

  const fetchAlerts = (queryParams) => {
    setLoading(true);
    const fetchData = async () => {
      let url = `/alerting/alert/_search`;
      const res = await request(url, {
        method: "GET",
        queryParams,
      });
      if (res && !res.error) {
        let { data, total } = formatESSearchResult(res);
        setDataSource({ data, total });
      }
      setLoading(false);
    };
    fetchData();
  };
  useEffect(() => {
    fetchAlerts(queryParams);
  }, [queryParams]);

  return (
    <div>
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
          }}
        >
          <div className="filters">
            <Select
              allowClear
              showSearch
              style={{ width: 150, marginRight: 10 }}
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
              value={queryParams?.state}
              onChange={(value) => {
                dispatch({ type: "state", value: value });
              }}
            >
              {Object.keys(RuleStautsColor).map((item) => {
                return (
                  <Option key={item} value={item}>
                    {item}
                  </Option>
                );
              })}
            </Select>
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
        </div>
      </div>
      {showAertMetric === true ? (
        <div style={{ height: 150 }}>
          <WidgetLoader
            id="cji1ttq8go5i051pl1t2"
            range={{
              from: timeRange.min,
              to: timeRange.max,
            }}
            queryParams={{
              rule_id: ruleID,
              priority: queryParams.priority,
              state: queryParams.state,
            }}
            refresh={refresh}
          />
        </div>
      ) : null}
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
      />
    </div>
  );
};

export default RuleRecords;
