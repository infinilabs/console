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
  Switch,
  Tooltip,
  Spin,
  Tag,
  Icon,
} from "antd";
import { HourglassOutlined } from "@ant-design/icons";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { useGlobal } from "@/layouts/GlobalContext";
import router from "umi/router";
import Link from "umi/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useRef,
} from "react";
import request from "@/utils/request";
import moment from "moment";
import { formatter } from "@/utils/format";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { filterSearchValue, sorter, formatUtcTimeToLocal } from "@/utils/utils";
import { HealthStatusView } from "@/components/infini/health_status_view";
import RefreshGroup from "@/components/infini/RefreshGroup";
import { hasAuthority } from "@/utils/authority";
import ClusterName from "@/pages/System/Cluster/components/ClusterName";
import { generateName } from "../common";
import { getTaskLifecycle, parseTaskConfig } from "@/pages/DataTools/utils";
import SegmentedProgress from "@/pages/DataTools/components/SegmentedProgress";

import SearchInput from "@/components/infini/SearchInput";
const ButtonGroup = Button.Group;

const Index = (props) => {
  const [searchValue, setSearchValue] = useState("");

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
  const [queryParams, dispatch] = useReducer(reducer, initialQueryParams);
  const [dataSource, setDataSource] = useState({ data: [], total: 0 });

  const { loading, error, value, run } = useFetch(
    "/comparison/data/_search",
    {
      queryParams: queryParams,
    },
    [queryParams]
  );

  const formatData = (data) => {
    if (!data) return [];
    return data.map((item) => {
      const { id, created, metadata, status, repeat, running_children,start_time_in_millis } = item;
      const config = parseTaskConfig(item);
      const indices = Array.isArray(config.indices) ? config.indices : [];
      const indicesCount = indices.length;
      const creator = config.creator?.name;
      const name = config.name;
      const labels = metadata?.labels || {};
      const taskRepeat = repeat || labels.repeat || {};
      const total_diff_docs = labels.total_diff_docs;
      const percent =
        status === "init"
          ? 0
          : labels.source_total_docs
          ? Math.round(
              ((labels.source_scroll_docs + labels.target_scroll_docs) /
                (labels.source_total_docs + labels.target_total_docs)) *
                100
            )
          : 0;

      return {
        id,
        created,
        indicesCount,
        sourceDocs: labels.source_total_docs,
        targetDocs: labels.target_total_docs,
        creator,
        percent,
        running_children,
        total_diff_docs,
        repeat: taskRepeat,
        status,
        cluster: config.cluster,
        start_time_in_millis,
        name,
      };
    });
  };

  useEffect(() => {
    const { data, total } = formatESSearchResult(value);
    setDataSource({
      data: formatData(data),
      total,
    });
  }, [value]);

  const onRefreshClick = () => {
    dispatch({ type: "refresh" });
  };

  const onDeleteClick = useCallback(async (id) => {
    const res = await request(`/comparison/data/${id}`, {
      method: "DELETE",
    });
    if (res && res.result === "deleted") {
      message.success(
        formatMessage({
          id: "app.message.delete.success",
        })
      );
      setTimeout(() => {
        onRefreshClick();
      }, 1000);
    } else {
      console.log("Delete failed,", res);
      message.error(
        formatMessage({
          id: "app.message.delete.failed",
        })
      );
    }
  }, []);

  const onStatusClick = useCallback(async (id, status) => {
    const res = await request(`/comparison/data/${id}/_status`, {
      method: "POST",
      body: { status: status },
    });
    if (res && res.result === "updated") {
      message.success(
        formatMessage({
          id: "app.message.update.success",
        })
      );
      setTimeout(() => {
        onRefreshClick();
      }, 1000);
    } else {
      console.log("Update failed,", res);
      message.error(
        formatMessage({
          id: "app.message.update.failed",
        })
      );
    }
  }, []);

  const onStart = async (id) => {
    const res = await request(`/comparison/data/${id}/_start`, {
      method: "POST",
    });
    if (res && res.success) {
      message.success(
        formatMessage({
          id: "app.message.start.success",
        })
      );
      setTimeout(() => {
        onRefreshClick();
      }, 1000);
    } else {
      message.error(
        formatMessage({
          id: "app.message.start.failed",
        })
      );
      console.log("Start failed,", res);
    }
  };

  const onResume = async (id) => {
    const res = await request(`/comparison/data/${id}/_resume`, {
      method: "POST",
    });
    if (res && res.success) {
      message.success(
        formatMessage({
          id: "app.message.resume.success",
        })
      );
      setTimeout(() => {
        onRefreshClick();
      }, 1000);
    } else {
      message.error(
        formatMessage({
          id: "app.message.resume.failed",
        })
      );
      console.log("Resume failed,", res);
    }
  };

  const onStop = async (id) => {
    const res = await request(`/comparison/data/${id}/_stop`, {
      method: "POST",
    });
    if (res && res.success) {
      message.success(
        formatMessage({
          id: "app.message.stop.success",
        })
      );
      setTimeout(() => {
        onRefreshClick();
      }, 1000);
    } else {
      message.error(
        formatMessage({
          id: "app.message.stop.failed",
        })
      );
      console.log("Stop failed,", res);
    }
  };

  const onPause = async (id) => {
    const res = await request(`/comparison/data/${id}/_pause`, {
      method: "POST",
    });
    if (res && res.success) {
      message.success(
        formatMessage({
          id: "app.message.pause.success",
        })
      );
      setTimeout(() => {
        onRefreshClick();
      }, 1000);
    } else {
      message.error(
        formatMessage({
          id: "app.message.pause.failed",
        })
      );
      console.log("Pause failed,", res);
    }
  };
  const formatNumber = (number) => {
    return Number.isInteger(number) ? formatter.number(number) : "N/A";
  };

  const columns = [
    {
      title: formatMessage({ id: "migration.table.field.name" }),
      width: 300,
      dataIndex: "name",
      render: (text, record) => {
       if(!text){
         text = generateName(record);
       }
       return <Tooltip title={text}>
        <div style={{maxWidth:360, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{text}</div>
       </Tooltip>
      },
    },
    {
      title: formatMessage({ id: "migration.table.field.progress" }),
      dataIndex: "percent",
      render: (value, record) => {
        let runningState = record.running_children > 0 ? 1 : 0;
        if(record.running_children === 0 && (record.status == "init" || record.status == "ready")) {  
            runningState = 0;
        }
        let status;
        if (runningState === 0) {
          status = "normal";
        } else {
          status = "active";
        }
        const progressTitle = <div style={{lineHeight: "2em"}}>
        {formatMessage({ id: "migration.label.source_docs" })}: {formatNumber(record.sourceDocs)}<br/>
        {formatMessage({ id: "migration.label.target_docs" })}: {formatNumber(record.targetDocs)}<br/>
        {formatMessage({ id: "migration.label.total_diff_docs" })}: {formatNumber(record.total_diff_docs)}<br/>
        {formatMessage({ id: "migration.title.progress" })}: {value}%
        </div>;
        let strokeColor
        if(record.status == "error" || record.error_partitions > 0){
          strokeColor = "#F35F5A";
        }else  if (record.status === "complete"){
          strokeColor = "#6CCE79";
        }
        let progressColor = "#448EF7";
        if (record.status == "error" || record.error_partitions > 0) {
          progressColor = "#F35F5A";
        } else if (record.status === "complete") {
          progressColor = "#6CCE79";
        } else if (status === "normal") {
          progressColor = "#D9D9D9";
         }
         return <div style={{ width: 190 }}>
           <Tooltip title={progressTitle}>
             <div>
               <SegmentedProgress
                 percent={value}
                 color={strokeColor || progressColor}
                 height={10}
                 segments={24}
               />
             </div>
           </Tooltip>
         </div>;
      },
     width: 240,
    },
    {
      title: formatMessage({ id: "migration.table.field.status" }),
      dataIndex: "running_children",
      render: (value, record) => {
        const lifecycle = getTaskLifecycle(record);
        const statusStyleMap = {
          running: { color: "#448EF7", backgroundColor: "rgba(68, 142, 247, 0.2)" },
          not_started: { color: "#8C8C8C", backgroundColor: "#F5F5F5" },
          pending: { color: "#8C8C8C", backgroundColor: "#F5F5F5" },
          stopped: { color: "#595959", backgroundColor: "#E8E8E8" },
          paused: { color: "#D48806", backgroundColor: "rgba(250, 173, 20, 0.18)" },
          stopping: { color: "#D46B08", backgroundColor: "rgba(255, 169, 64, 0.18)" },
          complete: { color: "#389E0D", backgroundColor: "rgba(108, 206, 121, 0.2)" },
          failed: { color: "#CF1322", backgroundColor: "rgba(243, 95, 90, 0.2)" },
        };
        const statusLabelMap = {
          running: "migration.label.running",
          not_started: "migration.label.not_started",
          pending: "migration.label.pending",
          stopped: "migration.label.stopped",
          paused: "migration.label.paused",
          stopping: "migration.label.stopping",
          complete: "migration.label.completed",
          failed: "migration.label.failed",
        };
        const diffStyle = statusStyleMap[lifecycle] || statusStyleMap.pending;
       
        return <div className="td-status">
          <Tag style={{border: "none", ...diffStyle }}>
            {formatMessage({ id: statusLabelMap[lifecycle] || "migration.label.pending" })}
          </Tag>
          {!record.repeat.is_repeat && record.status == "complete" ? <span style={{background:"rgba(108, 206, 121, 0.2)", padding: "1px 3px"}}>
            <Icon style={{color:"#6CCE79"}} type="check-circle"/> 
          </span>: null}
          {record.error_partitions > 0 ?  <Tooltip title={`${formatMessage({ id: "migration.label.error_partitions" })}: ${record.error_partitions}`}>
          <span style={{background: "rgba(243, 95, 90, 0.2)", padding: "1px 3px", marginRight: 3}}>
            <Icon style={{color:"#F35F5A"}} type="exclamation-circle" />
          </span></Tooltip>: null}
         {record.repeat.is_repeat?  <Tooltip title={<div>{formatMessage({ id: "migration.label.next_run_time" })}: <br/>{formatUtcTimeToLocal(record.repeat.next_run_time)}</div>}>
         <span style={{background: "rgba(68, 142, 247, 0.2)", padding: "1px 3px"}}>
            <Icon style={{color:"#448EF7"}} type="clock-circle" />
          </span></Tooltip>: null}
        </div>;
      },
      width: 150,
    },
    {
      title:formatMessage({ id: "migration.table.field.last_run_time" }),
      dataIndex: "start_time_in_millis",
      render: (value, record) => {
        let ltime = value
        if(record.repeat.is_repeat && record.repeat.last_run_time >0){
          ltime = record.repeat.last_run_time;
        }
        if(ltime === 0){
          return "-";
        }
        return formatUtcTimeToLocal(ltime);
      },
      width: 200,
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      width: 160, 
      render: (text, record) => {
        const actions = [];
        const hasPrivilege = hasAuthority("data_tools.comparison:all");
        const isRepeat = record.repeat?.is_repeat;
        const repeating = record.repeat?.repeating;

        if (hasPrivilege && ["init"].includes(record.status)) {
          actions.push(
            <Popconfirm
              title={formatMessage({ id: "migration.confirm.start" })}
              onConfirm={() => onStart(record.id)}
            >
              <a>{formatMessage({ id: "form.button.start" })}</a>
            </Popconfirm>
          );
        }

        if (!isRepeat) {
          if (hasPrivilege && ["stopped", "error", "complete"].includes(record.status)) {
            actions.push(
              <Popconfirm
                title={formatMessage({ id: "migration.confirm.restart" })}
                onConfirm={() => onStart(record.id)}
              >
                <a>{formatMessage({ id: "form.button.restart" })}</a>
              </Popconfirm>
            );
          }

          if (hasPrivilege && record.status === "running") {
            actions.push(
              <Popconfirm
                title={formatMessage({ id: "migration.confirm.stop" })}
                onConfirm={() => onStop(record.id)}
              >
                <a>{formatMessage({ id: "form.button.stop" })}</a>
              </Popconfirm>
            );
          }
        } else {
          if (hasPrivilege && !repeating) {
            actions.push(
              <Popconfirm
                title={formatMessage({ id: "migration.confirm.resume" })}
                onConfirm={() => onResume(record.id)}
              >
                <a>{formatMessage({ id: "form.button.resume" })}</a>
              </Popconfirm>
            );
          }

          if (hasPrivilege && repeating) {
            actions.push(
              <Popconfirm
                title={formatMessage({ id: "migration.confirm.pause" })}
                onConfirm={() => onPause(record.id)}
              >
                <a>{formatMessage({ id: "form.button.pause" })}</a>
              </Popconfirm>
            );
          }
        }

        actions.push(
          <Link key="detail" to={`/data_tools/comparison/${record.id}/detail`}>
            {formatMessage({ id: "form.button.detail" })}
          </Link>
        );
        if (
          hasPrivilege &&
          ["init", "stopped", "error", "complete"].includes(record.status) &&
          record.running_children === 0
        ) {
          actions.push(
            <Popconfirm
              title={formatMessage({ id: "migration.confirm.delete" })}
              onConfirm={() => onDeleteClick(record.id)}
            >
              <a>{formatMessage({ id: "form.button.delete" })}</a>
            </Popconfirm>
          );
        }

        return (
          <>
            {actions.map((item, index) => (
              <Fragment key={index}>
                {index !== 0 && <Divider type="vertical" />}
                {item}
              </Fragment>
            ))}
          </>
        );
      },
    },
  ];

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
            <SearchInput
              allowClear
              placeholder={formatMessage({ id: "migration.search.keyword" })}
              enterButton={formatMessage({ id: "form.button.search" })}
              onSearch={(value) => {
                dispatch({ type: "search", value });
              }}
              onChange={(e) => {
                setSearchValue(e.currentTarget.value);
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
            <RefreshGroup onRefresh={run} setRefreshIntervalFlag={() => {}} />
            {hasAuthority("data_tools.comparison:all") ? (
              <Button
                icon="plus"
                type="primary"
                onClick={() => router.push(`/data_tools/comparison/new`)}
              >
                {formatMessage({ id: "form.button.new" })}
              </Button>
            ) : null}
          </div>
        </div>
        <Table
          size={"small"}
          loading={loading}
          bordered={false}
          dataSource={dataSource.data}
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
      </Card>
    </PageHeaderWrapper>
  );
};

export default Index;
