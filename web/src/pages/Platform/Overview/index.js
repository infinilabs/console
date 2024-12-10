import React from "react";
import { Tabs, Row, Col, Card, Icon } from "antd";
import { formatMessage } from "umi/locale";
import styles from "./index.scss";
import { connect } from "dva";
import { formatter } from "@/lib/format";
import useFetch from "@/lib/hooks/use_fetch";
import { pathPrefix } from "@/services/common";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import Cluster from "@/pages/Platform/Overview/Cluster";
import Node from "@/pages/Platform/Overview/Node";
import Indices from "@/pages/Platform/Overview/Indices";
import Host from "@/pages/Platform/Overview/Host";
import ClustersSvg from "@/components/Icons/Clusters";
import NodesSvg from "@/components/Icons/Nodes";
import HostsSvg from "@/components/Icons/Hosts";

const { TabPane } = Tabs;

const panes = [
  {
    title: "Clusters",
    component: Cluster,
    key: "clusters",
    count: 0,
    icon: () => {
      return <Icon component={ClustersSvg} />;
    },
  },
  {
    title: "Nodes",
    component: Node,
    key: "nodes",
    count: 0,
    icon: () => {
      return <Icon component={NodesSvg} />;
    },
  },
  {
    title: "Indices",
    component: Indices,
    key: "indices",
    count: 0,
    icon: () => {
      return <Icon type="table" />;
    },
  },
  // {
  //   title: "Hosts",
  //   component: Host,
  //   key: "hosts",
  //   count: 0,
  //   icon: () => {
  //     return <Icon component={HostsSvg} />;
  //   },
  // },
];

const NewOverview = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);

  const [panesList, setPanesList] = React.useState(panes);

  const { loading, error, value } = useFetch(
    `${pathPrefix}/elasticsearch/overview`,
    {},
    []
  );

  React.useMemo(() => {
    if (value) {
      let panesListTmp = panesList.map((item) => {
        item.count = value[`${item.key}_count`] ?? 0;
        return item;
      });
      setPanesList(panesListTmp);
    }
  }, [value]);

  return (
    <div style={{ background: "#fff" }} className={styles.overview}>
      <div>
        <Tabs
          onChange={(key) => {
            setParam((param) => {
              return {
                tab: key,
              };
            });
          }}
          destroyInactiveTabPane
          tabBarGutter={10}
          tabindex="-1"
          activeKey={param?.tab || "clusters"}
        >
          {panesList.map((pane) => (
            <TabPane
              tab={
                <>
                  <pane.icon />
                  {`${pane.title}(${pane.count})`}
                </>
              }
              key={pane.key}
            >
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

export default connect(({ global }) => ({}))(NewOverviewUI);
