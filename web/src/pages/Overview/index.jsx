import { Card, Col, Row, Icon } from "antd";
import styles from "./index.less";
import { connect } from "dva";
import Welcome from "./components/Welcome";
import Message from "./components/Message";
import Status from "./components/Status";
import Disk from "./components/Disk";
import Quick from "./components/Quick";
import Product from "./components/Product";
import Activities from "./components/Activities";
import { useEffect, useState } from "react";
import request from "@/utils/request";
import { GREEN, GREY, RED, YELLOW } from "./components/PieChart";
import IconTitle from "./components/IconTitle";
import ClustersSvg from "@/components/Icons/Clusters";
import NodesSvg from "@/components/Icons/Nodes";
import HostsSvg from "@/components/Icons/Hosts";
import DiskSvg from "@/components/Icons/DB";

const STATUS = [
  {
    title: "cluster",
    icon: () => <Icon component={ClustersSvg} />,
    formatData: (data) => {
      const { cluster } = data || {};
      return [
        { group: "green", value: cluster?.green || 0, color: GREEN },
        { group: "yellow", value: cluster?.yellow || 0, color: YELLOW },
        { group: "red", value: cluster?.red || 0, color: RED },
        { group: "unavailable", value: cluster?.unavailable || 0, color: GREY },
      ];
    },
    linkTo: "/cluster/overview",
  },
  {
    title: "node",
    icon: () => <Icon component={NodesSvg} />,
    formatData: (data) => {
      const { node } = data || {};
      return [
        { group: "available", value: node?.available || 0, color: GREEN },
        { group: "unavailable", value: node?.unavailable || 0, color: GREY },
      ];
    },
    linkTo:
      '/cluster/overview?_g=%7B"tab"%3A"nodes"%2C"from"%3A0%2C"size"%3A5%2C"keyword"%3A""%7D',
  },
  {
    title: "host",
    icon: () => <Icon component={HostsSvg} />,
    formatData: (data) => {
      const { host } = data || {};
      return [{ group: "online", value: host?.online || 0, color: GREEN }];
    },
  },
  {
    title: "disk",
    icon: () => <Icon component={DiskSvg} />,
    render: () => <Disk />,
  },
];

export default connect(({ user }) => ({
  currentUser: user.currentUser,
}))((props) => {
  const { currentUser } = props;

  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    const res = await request("/elasticsearch/overview/status");
    if (res) {
      setStatus(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className={styles.overview}>
      <Row gutter={8} style={{ height: 150 }}>
        <Col sm={24} md={12}>
          <Welcome currentUser={currentUser} />
        </Col>
        <Col sm={24} md={12}>
          <Message currentUser={currentUser} />
        </Col>
      </Row>
      <Row gutter={8} style={{ height: 180, marginBottom: 24 }}>
        {STATUS.map((item, index) => (
          <Col key={index} sm={12} md={6}>
            <Card className={styles.status} size="small">
              <IconTitle title={item.title} icon={item.icon} />
              <div className={styles.content}>
                {item.render ? (
                  item.render()
                ) : (
                  <Status
                    data={item.formatData(status)}
                    linkTo={item.linkTo}
                    loading={loading}
                  />
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Row
        gutter={8}
        className={styles.news}
        style={{ height: "calc(100vh - 420px - 16px - 16px)", minHeight: 536 }}
      >
        <Col sm={24} md={24} lg={12} style={{ marginBottom: 16 }}>
          <Quick />
          <Product />
        </Col>
        <Col sm={24} md={24} lg={12}>
          <Activities />
        </Col>
      </Row>
    </div>
  );
});
