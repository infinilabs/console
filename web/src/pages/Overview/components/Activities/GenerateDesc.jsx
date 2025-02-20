import moment from "moment";
import { Link } from "umi";
import { Button, Icon, Tag } from "antd";
import { useMemo, useState } from "react";
import { formatMessage } from "umi/locale";

export default (props) => {
  const { hit, opers } = props;
  const name = hit._source.metadata.name;
  const type = hit._source.metadata.type;
  const timestamp = hit._source.timestamp;
  const timeRange = {
    min: moment(timestamp)
      .add(-15, "m")
      .toISOString(),
    max: moment(timestamp)
      .add(15, "m")
      .toISOString(),
  };
  const timeRangeStr = encodeURIComponent(JSON.stringify(timeRange));

  let indexName = hit._source.metadata.labels.index_name;
  let indexNameEncode = indexName;
  if (indexName && indexName.includes("%")) {
    indexNameEncode = encodeURIComponent(indexName);
  }
  const logStartTime = moment(timestamp).add(-3, "m");
  const logEndTime = moment(timestamp).add(3, "m");
  const logTimeRangeStr = encodeURIComponent(JSON.stringify({min:logStartTime.toISOString(),max:logEndTime.toISOString()}))


  switch (name) {
    case "index_state_change":
      if (type == "delete") {
        return (
          <>
            index{" "}
            <Link
              to={`/cluster/monitor/${hit._source.metadata.labels.cluster_id}/indices/${indexNameEncode}?_g={"timeRange":${timeRangeStr},"cluster_name":"${hit._source.metadata.labels.cluster_name}"}`}
            >
              {indexName}
            </Link>{" "}
            was <b>deleted</b> in cluster{" "}
            <Link
              to={`/cluster/monitor/elasticsearch/${hit._source.metadata.labels.cluster_id}?_g={"timeRange":${timeRangeStr}}`}
            >
              {hit._source.metadata.labels.cluster_name}
            </Link>
          </>
        );
      }
      if (type == "create") {
        return (
          <>
            index{" "}
            <Link
              to={`/cluster/monitor/${hit._source.metadata.labels.cluster_id}/indices/${indexNameEncode}?_g={"timeRange":${timeRangeStr},"cluster_name":"${hit._source.metadata.labels.cluster_name}"}`}
            >
              {indexName}
            </Link>{" "}
            was <b>created</b> in cluster{" "}
            <Link
              to={`/cluster/monitor/elasticsearch/${hit._source.metadata.labels.cluster_id}?_g={"timeRange":${timeRangeStr}}`}
            >
              {hit._source.metadata.labels.cluster_name}
            </Link>
          </>
        );
      }
      return (
        <>
          state of index{" "}
          <Link
            to={`/cluster/monitor/${hit._source.metadata.labels.cluster_id}/indices/${indexNameEncode}?_g={"timeRange":${timeRangeStr},"cluster_name":"${hit._source.metadata.labels.cluster_name}"}`}
          >
            {indexName}
          </Link>{" "}
          <b>{opers[type]}</b> in cluster{" "}
          <Link
            to={`/cluster/monitor/elasticsearch/${hit._source.metadata.labels.cluster_id}?_g={"timeRange":${timeRangeStr}}`}
          >
            {hit._source.metadata.labels.cluster_name}
          </Link>
        </>
      );
    case "index_health_change":
      return (
        <>
          health status of index{" "}
          <Link
            to={`/cluster/monitor/${hit._source.metadata.labels.cluster_id}/indices/${indexNameEncode}?_g={"timeRange":${timeRangeStr},"cluster_name":"${hit._source.metadata.labels.cluster_name}"}`}
          >
            {indexName}
          </Link>{" "}
          <b>{opers[type]}</b> from <b>{hit._source.metadata.labels.from}</b> to{" "}
          <b>{hit._source.metadata.labels.to}</b>
          <a
          size="small"
          style={{ marginLeft: 12, cursor: 'pointer' }} 
          >
            <Icon type="file-text" style={{marginRight:2}}/> 
            <Link
            to={`/cluster/monitor/elasticsearch/${hit._source.metadata.labels.cluster_id}?_g={"tab":"logs","timeRange":${logTimeRangeStr}}`}
            >{formatMessage({ id: "form.button.view_logs" })}
            </Link>
        </a>
        </>
      );
    case "cluster_health_change":
      return <ClusterHealthChange hit={hit} type={opers[type]} timeRangeStr={timeRangeStr} logTimeRangeStr={logTimeRangeStr}/>
    case "node_health_change":
      return (
        <>
          health status of node{" "}
          <Link
            to={`/cluster/monitor/${hit._source.metadata.labels.cluster_id}/nodes/${hit._source.metadata.labels.node_id}?_g={"timeRange":${timeRangeStr},"cluster_name":"${hit._source.metadata.labels.cluster_name}","node_name":"${hit._source.metadata.labels.node_name}"}`}
          >
            {hit._source.metadata.labels.node_name}
          </Link>{" "}
          in cluster{" "}
          <Link
            to={`/cluster/monitor/elasticsearch/${hit._source.metadata.labels.cluster_id}?_g={"timeRange":${timeRangeStr}}`}
          >
            {hit._source.metadata.labels.cluster_name}
          </Link>{" "}
          <b>{opers[type]}</b> to <b>{hit._source.metadata.labels.to}</b>
          <a
            size="small"
            style={{ marginLeft: 12, cursor: 'pointer' }} 
          >
            <Icon type="file-text" style={{marginRight:2}}/> 
            <Link
          to={`/cluster/monitor/${hit._source.metadata.labels.cluster_id}/nodes/${hit._source.metadata.labels.node_id}?_g={"tab":"logs","timeRange":${logTimeRangeStr}}`}
        >{formatMessage({ id: "form.button.view_logs" })}</Link>
        </a>
        </>
      );
    case "node_state_change":
      return (
        <>
          state of node{" "}
          <Link
            to={`/cluster/monitor/${
              hit._source.metadata.labels.cluster_id
            }/nodes/${hit._source.metadata.labels.node_uuid ||
              hit._source.metadata.labels
                .node_id}?_g={"timeRange":${timeRangeStr},"cluster_name":"${
              hit._source.metadata.labels.cluster_name
            }","node_name":"${hit._source.metadata.labels.node_name}"}`}
          >
            {hit._source.metadata.labels.node_name}
          </Link>{" "}
          <b>{opers[type]}</b> in cluster{" "}
          <Link
            to={`/cluster/monitor/elasticsearch/${hit._source.metadata.labels.cluster_id}?_g={"timeRange":${timeRangeStr}}`}
          >
            {hit._source.metadata.labels.cluster_name}
          </Link>
        </>
      );
    case "cluster_settings_change":
      return (
        <>
          settings of cluster{" "}
          <Link
            to={`/cluster/monitor/elasticsearch/${hit._source.metadata.labels.cluster_id}?_g={"timeRange":${timeRangeStr}}`}
          >
            {hit._source.metadata.labels.cluster_name}
          </Link>{" "}
          <b>{opers[type]}</b>
        </>
      );
    case "alerting_rule_change":
      if (type == "delete") {
        return (
          <>
            alerting rule <b>{hit._source.metadata.labels.rule_name}</b> was{" "}
            <b>deleted</b>
          </>
        );
      }
      if (type == "create") {
        return (
          <>
            alerting rule{" "}
            <Link to={`/alerting/rule/${hit._source.metadata.labels.rule_id}`}>
              {hit._source.metadata.labels.rule_name}
            </Link>{" "}
            was <b>created</b>
          </>
        );
      }
      return (
        <>
          settings of rule{" "}
          <Link to={`/alerting/rule/${hit._source.metadata.labels.rule_id}`}>
            {hit._source.metadata.labels.rule_name}
          </Link>{" "}
          was <b>updated</b>
        </>
      );
    case "cluster_config":
      // if (type == "delete") {
      //   return (
      //     <>
      //       config of cluster <b>{hit._source.metadata.labels.rule_id}</b> was{" "}
      //       <b>deleted</b>
      //     </>
      //   );
      // }
      if (type == "create") {
        return (
          <>
            cluster{" "}
            <Link
              to={`/resource/cluster/${hit._source.metadata.labels.cluster_id}/edit`}
            >
              {hit._source.metadata.labels.cluster_name}
            </Link>{" "}
            was <b>registed</b>
          </>
        );
      }
      if (type == "update") {
        return (
          <>
            cluster{" "}
            <Link
              to={`/resource/cluster/${hit._source.metadata.labels.cluster_id}/edit`}
            >
              {hit._source.metadata.labels.cluster_name}
            </Link>{" "}
            was <b>updated</b>
          </>
        );
      }
      case "metric_collection_mode_change":
      if (type == "update") {
        return (
          <>
            metric collection mode of cluster{" "}
            <Link
              to={`/resource/cluster/${hit._source.metadata.labels.cluster_id}/edit`}
            >
              {hit._source.metadata.labels.cluster_name}
            </Link>{" "}
            was <b>changed from {hit._source.metadata.labels.from} to {hit._source.metadata.labels.to}</b>
          </>
        );
      }
  }
  return <></>;
};

const ClusterHealthChange = (props) => {
  const { hit, type, timeRangeStr, logTimeRangeStr } = props;
  const status = hit._source.metadata.labels.to
  const hasAllocationExplain = status === 'red'

  const [active, setActive] = useState(false)
  const content = (
    <span 
      style={{ cursor: hasAllocationExplain ? 'pointer' : 'default'}} 
      onClick={() => {
        if (hasAllocationExplain) {
          setActive(!active)
        }
      }}
    >
      health status of cluster{" "}
      <Link
        to={`/cluster/monitor/elasticsearch/${hit._source.metadata.labels.cluster_id}?_g={"timeRange":${timeRangeStr}}`}
      >
        {hit._source.metadata.labels.cluster_name}
      </Link>{" "}
      <b>{type}</b> from <b>{hit._source.metadata.labels.from}</b> to{" "}
      <b>{status}</b>{hasAllocationExplain ? (
        <a
          size="small"
          style={{ marginLeft: 12, cursor: 'pointer' }} 
          onClick={() => {
            if (hasAllocationExplain) {
              setActive(!active)
            }
          }}
        >
          <Icon type={active ? "up-square" : "down-square"}/> {formatMessage({ id: "form.button.detail" })} 
        </a>
      ) : null}
      <a
          size="small"
          style={{ marginLeft: 12, cursor: 'pointer' }} 
        >
          <Icon type="file-text" style={{marginRight:2}}/> 
          <Link
        to={`/cluster/monitor/elasticsearch/${hit._source.metadata.labels.cluster_id}?_g={"tab":"logs","timeRange":${logTimeRangeStr}}`}
      >{formatMessage({ id: "form.button.view_logs" })}</Link>
        </a>
    </span>
  )

  const allocationExplain = useMemo(() => {
    if (!hit._source.payload?.cluster_health?.allocation_explain) return {}
    try { 
      const object = JSON.parse(hit._source.payload?.cluster_health?.allocation_explain)
      return object
    } catch (error) {
      return {}
    }
  }, [hit._source.payload?.cluster_health?.allocation_explain])

  return active ? (
    <div>
      <div>{content}</div>
      <pre style={{ margin: 0, fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'` }}>
        {JSON.stringify(allocationExplain, null, 4)}
      </pre>
    </div>
  ) : content
}
