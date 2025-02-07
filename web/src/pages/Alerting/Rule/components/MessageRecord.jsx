import { Table, Tag, Button, Select } from "antd";
import WidgetLoader from "@/pages/DataManagement/View/WidgetLoader";
import useFetch from "@/lib/hooks/use_fetch";
import { useEffect, useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import EventMessageStatus from "../../Message/components/EventMessageStatus";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { PriorityColor, PriorityToIconType } from "../../utils/constants";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { PriorityIconText } from "../../components/Statistic";
import moment from "moment";
import { Link } from "umi";
const Option = Select.Option;

export default ({ ruleID, timeRange, refresh }) => {
  const initialQueryParams = {
    from: 0,
    size: 10,
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
    }
    return queryParams;
  };
  const [queryParams, dispatch] = React.useReducer(
    alertReducer,
    initialQueryParams
  );

  const [dataSource, setDataSource] = useState({ data: [], total: 0 });
  const { value, loading } = useFetch(
    `/alerting/message/_search`,
    {
      queryParams: {
        ...queryParams,
        rule_id: ruleID,
        min: timeRange.min,
        max: timeRange.max,
      },
    },
    [ruleID, queryParams, timeRange]
  );
  let { data, total } = useMemo(() => {
    if (!value || value.error) {
      return { data: [], total: 0 };
    }
    return formatESSearchResult(value);
  }, [value]);
  const columns = [
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
          <Link
            to={`/alerting/message/${record.id}`}
            style={{
              maxWidth: 360,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              display: "block",
              overflow: "hidden",
            }}
          >
            {text}
          </Link>
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
    //   render: (val, record) => {
    //     return (val || []).map((item) => {
    //       return <Tag style={{ color: "rgb(0, 127, 255)" }}>{item}</Tag>;
    //     });
    //   },
    // },
    {
      title: formatMessage({ id: "alert.message.table.created" }),
      dataIndex: "created",
      width: 200,
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
      },
    },
    // {
    //   title: formatMessage({ id: "table.field.actions" }),
    //   render: (text, record) => {
    //     const onSingleMenuClick = ({key})=>{
    //       switch(key) {
    //         case "ignore":
    //           showIgnoreConfirm([{ id: record.id, rule_id: record.rule_id }]);
    //           break
    //         case "reset":
    //           resetMessage([{ id: record.id, rule_id: record.rule_id, is_reset: true }]);
    //           break
    //       }
    //     }
    //     const menu = generateMenu(onSingleMenuClick);
    //    return <div>
    //       <Dropdown overlay={menu}>
    //         <a><Icon type="ellipsis" /></a>
    //       </Dropdown>
    //     </div>
    //   },
    // },
  ];
  const onRefreshClick = () => {
    dispatch({ type: "refresh" });
  };

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
              value={queryParams?.status}
              onChange={(value) => {
                dispatch({ type: "status", value: value });
              }}
            >
              <Option value="alerting">alerting</Option>
              <Option value="ignored">ignored</Option>
              <Option value="recovered">recovered</Option>
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
            type="primary"
            ghost
            onClick={() => {
              onRefreshClick();
            }}
          >
            {formatMessage({ id: "form.button.refresh" })}
          </Button>
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
            from: timeRange.min,
            to: timeRange.max,
          }}
          queryParams={{
            rule_id: ruleID,
            priority: queryParams.priority,
            status: queryParams.status,
          }}
          refresh={refresh}
        />
      </div>
      <Table
        size={"small"}
        loading={loading}
        bordered={false}
        dataSource={data}
        rowKey={"id"}
        pagination={{
          size: "small",
          pageSize: queryParams.size,
          total: total?.value || total,
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
