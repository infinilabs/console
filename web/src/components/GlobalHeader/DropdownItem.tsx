import {Icon} from 'antd';
import styles from './DropdownSelect.less';
import {HealthStatusCircle} from '@/components/infini/health_status_circle'

export interface ClusterItem {
  id: string
  name: string
  version: string
  endpoint: string
}

export interface ClusterStatus {
  available: boolean
  health: any
  nodes_count: number
}

interface props {
  clusterItem?: ClusterItem
  clusterStatus?: ClusterStatus
  onClick: React.MouseEventHandler<HTMLDivElement> | undefined
  isSelected: boolean
}

export const DropdownItem = ({
  clusterItem,
  clusterStatus,
  onClick,
  isSelected
}:props)=>{
  return <div className={styles["dropdown-item"] +" " + (isSelected ? styles['selected']: '')} onClick={onClick}>
    <div className={styles["wrapper"]}>
      {clusterStatus?.available ? <HealthStatusCircle status={clusterStatus?.health?.status} />: <Icon type='close-circle' style={{width:14, height:14, color:'red',borderRadius: 14, boxShadow: '0px 0px 5px #555'}} />}
      <span className={styles["name"]} >{clusterItem?.name}</span>
      <div className={styles["version"]}>{clusterItem?.version}</div>
    </div>
  
  </div>
}