import React, { useState } from "react";
import { Tabs, Button } from "antd";
import { ESPrefix } from "@/services/common";
import useFetch from "@/lib/hooks/use_fetch";
import { MonitorDatePicker } from "../../datepicker";
import { formatter } from "@/utils/format";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import moment from "moment";
import { Link } from "react-router-dom";
import { MetricSeries } from "./metric_series";
import { MetricIndices } from "../../detail/metric_indices";
import styles from "../../detail/metrics.scss";
import { formatMessage } from "umi/locale";

const { TabPane } = Tabs;

export const Metrics = (props) => {
  const nodeID = props.data?._source?.metadata?.node_id;
  const clusterID = props.data?._source?.metadata?.cluster_id;
  const clusterName = props.data?._source?.metadata?.cluster_name;
  const nodeName = props.data?._source?.metadata?.node_name;
  const transportAddress =
    props.data?._source?.metadata?.labels?.transport_address;
  if (!nodeID || !clusterID) {
    return null;
  }

  const [spinning, setSpinning] = useState(false);
  const [state, setState] = useState({
    timeRange: {
      min: "now-15m",
      max: "now",
      timeFormatter: formatter.dates(1),
    },
  });
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
      timeRange: {
        min: start,
        max: end,
        timeFormatter: formatter.dates(intDay),
      },
    });
    setSpinning(true);
  };

  return (
    <div className={styles.metrics}>
      <div className={styles.monitorDatePickerWrapper}>
        <MonitorDatePicker
          timeRange={state.timeRange}
          isLoading={spinning}
          onChange={handleTimeChange}
        />
      </div>

      <div className={styles.metricWrapper}>
        <MetricSeries
          clusterID={clusterID}
          nodeID={nodeID}
          timeRange={state.timeRange}
          overview={1}
          setSpinning={setSpinning}
        />
      </div>

      <div className={styles.metricWrapper}>
        <Tabs size={"small"}>
          <TabPane tab="Indices" key="indices">
            <MetricIndices
              clusterID={clusterID}
              clusterName={clusterName}
              timeRange={state.timeRange}
              fetchUrl={`${ESPrefix}/${clusterID}/node/${nodeID}/indices`}
            />
          </TabPane>
        </Tabs>
      </div>

      <div className={styles.detailMore}>
        <Link
          to={`/cluster/monitor/${clusterID}/nodes/${nodeID}?_g={"cluster_name":"${clusterName}","node_name":"${nodeName}"}`}
        >
          <Button type="primary">
            {formatMessage({ id: "overview.card.detail.click_for_more" })}
          </Button>
        </Link>
      </div>
    </div>
  );
};
