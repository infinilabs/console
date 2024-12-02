import { Card, Col, Icon, Row } from "antd";
import styles from "./index.less";
import { router } from "umi";
import MessageIcon from "./icons/MessageIcon";
import DevToolIcon from "./icons/DevToolIcon";
import ClusterIcon from "./icons/ClusterIcon";
import SecurityIcon from "./icons/SecurityIcon";
import DiscoverIcon from "./icons/DiscoverIcon";
import { formatMessage } from "umi/locale";

const ROUTES = [
  {
    path: "/resource/cluster",
    name: "cluster_regist",
    icon: ClusterIcon,
  },
  {
    path: "/insight/discover",
    name: "discover",
    icon: DiscoverIcon,
  },
  {
    path: "/alerting/message",
    name: "alert",
    icon: MessageIcon,
  },
  {
    path: "/devtool/console",
    name: "dev_tools",
    icon: DevToolIcon,
  },
  {
    path: "/system/security",
    name: "security",
    icon: SecurityIcon,
  },
];

export default () => {
  return (
    <div className={styles.quick}>
      <div className={styles.title}>
        {formatMessage({ id: "overview.title.quick" })}
      </div>
      <Row gutter={8}>
        {ROUTES.map((item, index) => (
          <Col key={index} span={12} className={styles.item}>
            <Card onClick={() => router.push(item.path)} size="small" bodyStyle={{display:"flex"}}>
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
