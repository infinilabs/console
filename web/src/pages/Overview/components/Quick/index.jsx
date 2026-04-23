import { Card, Col, Icon, Row } from "antd";
import styles from "./index.less";
import { router } from "umi";
import MessageIcon from "./icons/MessageIcon";
import DevToolIcon from "./icons/DevToolIcon";
import ClusterIcon from "./icons/ClusterIcon";
import SecurityIcon from "./icons/SecurityIcon";
import DiscoverIcon from "./icons/DiscoverIcon";
import MonitorIcon from "./icons/MonitorIcon";
import MigrationIcon from "./icons/MigrationIcon";
import { formatMessage } from "umi/locale";
import {
  getEnterpriseTaskManagerEnabled,
  hasAuthority,
} from "@/utils/authority";

const getRoutes = () => {
  const routes = [
    {
      path: "/resource/cluster",
      name: "cluster_regist",
      icon: ClusterIcon,
    },
    {
      path: "/alerting/message",
      name: "alert",
      icon: MessageIcon,
    },
    {
      path: "/insight/discover",
      name: "discover",
      icon: DiscoverIcon,
    },
    {
      path: "/cluster/monitor",
      name: "monitor",
      icon: MonitorIcon,
    },
    {
      path: "/system/security",
      name: "security",
      icon: SecurityIcon,
    },
    {
      path: "/devtool/console",
      name: "dev_tools",
      icon: DevToolIcon,
    },
  ];

  if (
    getEnterpriseTaskManagerEnabled() === "true" &&
    (hasAuthority("data_tools.comparison:all") ||
      hasAuthority("data_tools.comparison:read"))
  ) {
    routes.unshift({
      path: "/data_tools/comparison",
      name: "comparison",
      icon: MigrationIcon,
    });
  }

  if (
    getEnterpriseTaskManagerEnabled() === "true" &&
    (hasAuthority("data_tools.migration:all") ||
      hasAuthority("data_tools.migration:read"))
  ) {
    routes.unshift({
      path: "/data_tools/migration",
      name: "migration",
      icon: MigrationIcon,
    });
  }

  return routes;
};

export default () => {
  const routes = getRoutes();
  const compactLayout = routes.length > 6;

  return (
    <div className={styles.quick}>
      <div className={styles.title}>
        {formatMessage({ id: "overview.title.quick" })}
      </div>
      <Row gutter={8}>
        {routes.map((item, index) => (
          <Col
            key={index}
            xs={24}
            sm={12}
            lg={compactLayout ? 8 : 12}
            xl={compactLayout ? 6 : 12}
            className={styles.item}
          >
            <Card
              onClick={() => router.push(item.path)}
              size="small"
              bodyStyle={{ display: "flex", alignItems: "center", height: "100%" }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {item.icon && (
                  <Icon className={styles.icon} component={item.icon} />
                )}
                <div className={styles.name}>
                  {formatMessage({ id: `overview.quick.${item.name}` })}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};
