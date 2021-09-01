export type ClusterHealthStatus = 'green' | 'yellow' | 'red';

const statusColorMap: Record<string, string> = {
  'green': '#39b362',
  'yellow': 'yellow',
  'red': 'red',
}

export function convertStatusToColor(status: ClusterHealthStatus){
  return statusColorMap[status];
}

interface props {
  status: ClusterHealthStatus
}

export const HealthStatusCircle = ({status}: props)=>{
  const color = convertStatusToColor(status);
  return <div style={{background: color, height:14, width:14, borderRadius: 14, boxShadow: '0px 0px 5px #999', display: 'inline-block'}}></div>
}