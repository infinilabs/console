import ClusterMetric from "../../components/cluster_metric";
import { Button } from 'antd';
import InstallAgent from '@/components/Overview/Monitor/InstallAgent';
import { formatMessage } from "umi/locale";

const timezone = "local";

export default ({
  hostID,
  timeRange,
  handleTimeChange,
  info
}) => {
  return (
    <ClusterMetric
      timezone={timezone}
      timeRange={timeRange}
      handleTimeChange={handleTimeChange}
      fetchUrl={`/host/${hostID}/metrics`}
      renderExtra={() => {
        if (info?.agent_id) return;
        return <InstallAgent height={226} desc={formatMessage({ id: "cluster.metrics.host.uninstall_agent" })}/>
      }}
    />
  );
}