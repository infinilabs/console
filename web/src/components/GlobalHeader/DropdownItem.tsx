import { Icon } from "antd";
import styles from "./DropdownSelect.less";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";

export interface ClusterItem {
  id: string;
  name: string;
  version: string;
  endpoint: string;
}

export interface ClusterStatus {
  available: boolean;
  health: any;
  nodes_count: number;
}

interface props {
  clusterItem?: ClusterItem;
  clusterStatus?: ClusterStatus;
  onClick: React.MouseEventHandler<HTMLDivElement> | undefined;
  isSelected: boolean;
}

export const DropdownItem = ({
  clusterItem,
  clusterStatus,
  onClick,
  isSelected,
}: props) => {
  return (
    <div
      className={
        styles["dropdown-item"] + " " + (isSelected ? styles["selected"] : "")
      }
      onClick={onClick}
    >
      <div className={styles["wrapper"]}>
        <HealthStatusCircle
          status={
            clusterStatus?.available
              ? clusterStatus?.health?.status
              : "unavailable"
          }
        />

        <div className={styles["name"]}>{clusterItem?.name}</div>
        <div className={styles["version"]}>{clusterItem?.version}</div>
      </div>
    </div>
  );
};
