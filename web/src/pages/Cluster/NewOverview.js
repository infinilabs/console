import * as React from "react";
import { Tabs, Row, Col, Card } from "antd";
import { formatMessage } from "umi/locale";
import Clusters from "./components/clusters";
// import Hosts from "./components/host/hosts";
import Nodes from "./components/node/nodes";
import Indices from "./components/index/indices";
import styles from "./Overview.less";
import { connect } from "dva";
import { formatter } from "@/lib/format";
import useFetch from "@/lib/hooks/use_fetch";
import { pathPrefix } from "@/services/common";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import { default as Hosts } from "./components/host/host_table";

const { TabPane } = Tabs;

const panes = [
  { title: "Clusters", component: Clusters, key: "clusters" },
  { title: "Nodes", component: Nodes, key: "nodes" },
  { title: "Indices", component: Indices, key: "indices" },
  // { title: "Hosts", component: Hosts, key: "hosts" },
];

const NewOverview = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);

  const { loading, error, value: overview } = useFetch(
    `${pathPrefix}/elasticsearch/overview`,
    {},
    []
  );
  const { clusterTotal } = props;

  const totalStoreSize = formatter.bytes(
    overview?.total_used_store_in_bytes || 0
  );

  return (
    <div style={{ background: "#fff" }} className="overview">
      <div>
        <Row gutter={24} className={styles.rowSpace}>
          <Col md={6} sm={12}>
            <Card
              bodyStyle={{ paddingBottom: 20 }}
              className={styles.clusterMeta}
            >
              <Card.Meta
                title={formatMessage({
                  id: "overview.card.cluster.total_count",
                })}
                className={styles.title}
              />
              <div>
                <span className={styles.total}>
                  {clusterTotal?.value || "-"}
                </span>
              </div>
            </Card>
          </Col>
          <Col md={6} sm={12}>
            <Card
              bodyStyle={{ paddingBottom: 20 }}
              className={styles.clusterMeta}
            >
              <Card.Meta
                title={formatMessage({ id: "overview.card.host.total_count" })}
                className={styles.title}
              />
              <div>
                <span className={styles.total}>
                  {overview?.hosts_count || "-"}
                </span>
              </div>
            </Card>
          </Col>
          <Col md={6} sm={12}>
            <Card
              bodyStyle={{ paddingBottom: 20 }}
              className={styles.clusterMeta}
            >
              <Card.Meta
                title={formatMessage({ id: "overview.card.node.total_count" })}
                className={styles.title}
              />
              <div>
                <span className={styles.total}>
                  {overview?.nodes_count || "-"}
                </span>
              </div>
            </Card>
          </Col>
          <Col md={6} sm={12}>
            <Card
              bodyStyle={{ paddingBottom: 20 }}
              className={styles.clusterMeta}
            >
              <Card.Meta
                title={formatMessage({
                  id: "overview.card.disk.used_total_count",
                })}
                className={styles.title}
              />
              <div>
                <span className={styles.total}>
                  {totalStoreSize.size || "-"}
                </span>
                <span className={styles.unit}>{totalStoreSize.unit}</span>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
      <div>
        <Tabs
          onChange={(key) => {
            setParam((param) => {
              return {
                tab: key,
              };
            });
          }}
          type="card"
          destroyInactiveTabPane
          tabBarGutter={10}
          tabindex="-1"
          activeKey={param?.tab || "clusters"}
        >
          {panes.map((pane) => (
            <TabPane tab={pane.title} key={pane.key}>
              {typeof pane.component == "string" ? (
                pane.component
              ) : (
                <pane.component />
              )}
            </TabPane>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

const NewOverviewUI = (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <NewOverview {...props} />
    </QueryParamProvider>
  );
};

export default connect(({ global }) => ({
  clusterTotal: global.clusterTotal,
}))(NewOverviewUI);
