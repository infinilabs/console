import React, { useState, useMemo } from "react";
import { Card, Tabs } from "antd";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import { MonitorDatePicker } from "../../datepicker";
import { formatter } from "@/utils/format";
import moment from "moment";
import Overview from "./overview";
import Advanced from "./advanced";
import Shards from "./shards";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import BreadcrumbList from "@/components/infini/BreadcrumbList";
import { formatMessage } from "umi/locale";

const { TabPane } = Tabs;

const panes = [
  { title: "Overview", component: Overview, key: "overview" },
  { title: "Advanced", component: Advanced, key: "advanced" },
  { title: "Shards", component: Shards, key: "shards" },
];

const Index = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const [spinning, setSpinning] = useState(false);
  const [state, setState] = useState({
    clusterID: props.match.params?.cluster_id || "",
    clusterName: param?.cluster_name || "",
    indexName: props.match.params?.index_name || "",
    timeRange: {
      min: param?.timeRange?.min || "now-15m",
      max: param?.timeRange?.max || "now",
      timeFormatter: formatter.dates(1),
    },
  });

  useMemo(() => {
    setParam({ ...param, timeRange: state.timeRange });
  }, [state.timeRange]);

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
      title: state.clusterName || state.clusterID,
      href: `/#/cluster/monitor/elasticsearch/${state.clusterID}`,
    },
    {
      title: "Indices",
      href: `/#/cluster/monitor/elasticsearch/${state.clusterID}?_g={"tab":"indices"}`,
    },
    {
      title: state.indexName,
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
          tabBarGutter={10}
          destroyInactiveTabPane
          animated={false}
          activeKey={param?.tab || "overview"}
          onChange={(key) => {
            setParam({ ...param, tab: key });
          }}
        >
          {panes.map((pane) => (
            <TabPane tab={pane.title} key={pane.key}>
              {typeof pane.component == "string" ? (
                pane.component
              ) : (
                <pane.component
                  {...state}
                  handleTimeChange={handleTimeChange}
                  setSpinning={setSpinning}
                />
              )}
            </TabPane>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Index {...props} />
    </QueryParamProvider>
  );
};
