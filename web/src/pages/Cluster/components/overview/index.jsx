import React, { useState, useMemo } from "react";
import { Card, Tabs, Breadcrumb } from "antd";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import { MonitorDatePicker } from "../datepicker";
import { formatter } from "@/utils/format";
import moment from "moment";
import Overview from "./overview";
import Nodes from "./nodes";
import Indices from "./indices";
import Advanced from "./advanced";
import BreadcrumbList from "@/components/infini/BreadcrumbList";
import { connect } from "dva";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import { formatMessage } from "umi/locale";

const { TabPane } = Tabs;

const panes = [
  { title: "Overview", component: Overview, key: "overview" },
  { title: "Advanced", component: Advanced, key: "advanced" },
  { title: "Nodes", component: Nodes, key: "nodes" },
  { title: "Indices", component: Indices, key: "indices" },
];

const Index = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);

  let clusterAvailable = true;
  let clusterMonitored = true;
  const { clusterStatus: cstatus, selectedCluster } = props;
  if (cstatus && selectedCluster && cstatus[selectedCluster.id]) {
    clusterAvailable = cstatus[selectedCluster.id].available;
    clusterMonitored = cstatus[selectedCluster.id].config.monitored;
  }

  const [spinning, setSpinning] = useState(false);
  const [state, setState] = useState({
    clusterID: props.match.params?.cluster_id || "",
    timeRange: {
      min: param?.timeRange?.min || "now-15m",
      max: param?.timeRange?.max || "now",
      timeFormatter: formatter.dates(1),
    },
  });

  useMemo(() => {
    setParam({ ...param, timeRange: state.timeRange });
  }, [state.timeRange]);

  const [selectedClusterID] = React.useMemo(() => {
    let selectedClusterID = props.selectedCluster.id;
    if (selectedClusterID && selectedClusterID != state.clusterID) {
      setState({ ...state, clusterID: selectedClusterID });
    }

    return [selectedClusterID];
  }, [props.selectedCluster.id]);

  const handleTimeChange = ({ start, end }) => {
    const bounds = calculateBounds({
      from: start,
      to: end,
    });
    const day = moment
      .duration(bounds.max.valueOf() - bounds.min.valueOf())
      .asDays();
    const intDay = parseInt(day) + 1;
    setState({
      ...state,
      timeRange: {
        min: start,
        max: end,
        timeFormatter: formatter.dates(intDay),
      },
    });
    setSpinning(true);
  };

  const breadcrumbList = [
    {
      title: formatMessage({ id: "menu.home" }),
      href: "/",
    },
    {
      title: formatMessage({ id: "menu.cluster" }),
    },
    {
      title: formatMessage({ id: "menu.cluster.monitoring" }),
    },
    {
      title: props.selectedCluster.name || "",
    },
  ];
  return (
    <div>
      <BreadcrumbList data={breadcrumbList} />

      <Card bodyStyle={{ padding: 15 }}>
        <div style={{ marginBottom: 5 }}>
          <MonitorDatePicker
            timeRange={state.timeRange}
            isLoading={spinning}
            onChange={handleTimeChange}
          />
        </div>

        <Tabs
          activeKey={param?.tab || "overview"}
          onChange={(key) => {
            setParam(() => {
              return {
                tab: key,
              };
            });
          }}
          tabBarGutter={10}
          destroyInactiveTabPane
          animated={false}
        >
          {panes.map((pane) => (
            <TabPane tab={pane.title} key={pane.key}>
              {typeof pane.component == "string" ? (
                pane.component
              ) : (
                <pane.component
                  {...state}
                  clusterName={props.selectedCluster.name}
                  handleTimeChange={handleTimeChange}
                  setSpinning={setSpinning}
                  clusterAvailable={clusterAvailable}
                  clusterMonitored={clusterMonitored}
                />
              )}
            </TabPane>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

const IndexUI = (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Index {...props} />
    </QueryParamProvider>
  );
};

export default connect(({ global }) => ({
  selectedCluster: global.selectedCluster,
  clusterStatus: global.clusterStatus,
}))(IndexUI);
