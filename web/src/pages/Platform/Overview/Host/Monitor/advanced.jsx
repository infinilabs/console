import ClusterMetric from "../../components/cluster_metric";
import { Button } from 'antd';
import InstallAgent from '@/components/Overview/Monitor/InstallAgent';
import { formatMessage } from "umi/locale";

export default ({
  hostID,
  timeRange,
  handleTimeChange,
  info,
  bucketSize,
  timezone,
  timeout,
  refresh,
}) => {

  const isAgent = info?.agent_id

  return (
    <ClusterMetric
      timezone={timezone}
      timeRange={timeRange}
      timeout={timeout}
      bucketSize={bucketSize}
      refresh={refresh}
      handleTimeChange={handleTimeChange}
      fetchUrl={`/host/${hostID}/metrics`}
      renderExtra={() => {
        if (isAgent) return;
        return <InstallAgent height={226} desc={formatMessage({ id: "cluster.metrics.host.uninstall_agent" })}/>
      }}
      metrics={[
        'cpu_used_percent', 
        'memory_used_percent', 
        'disk_used_percent', 
        isAgent ? 'network_summary' : undefined, 
        isAgent ? 'disk_read_rate' : undefined, 
        isAgent ? 'disk_write_rate' : undefined,
        isAgent ? 'system_load' : undefined,
        isAgent ? 'cpu_iowait' : undefined,
        isAgent ? 'swap_memory_used_percent' : undefined,
        isAgent ? 'network_packets_summary' : undefined,
        isAgent ? 'disk_partition_usage' : undefined,
        isAgent ? 'network_interface_output_rate' : undefined,
      ].filter((item) => !!item)}
    />
  );
}