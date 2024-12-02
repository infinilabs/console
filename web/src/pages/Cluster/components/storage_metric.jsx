import * as React from "react";
import {
  Axis,
  Chart,
  CurveType,
  LineSeries,
  niceTimeFormatByDay,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from "@elastic/charts";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import styles from "../Metrics.scss";
import { Spin, Radio, Select, Skeleton, Row, Col } from "antd";
import moment from "moment";
import { formatMessage } from "umi/locale";
import { formatter } from "@/utils/format";
import { Treemap } from "@ant-design/charts";

export default ({ clusterID, timezone }) => {
  if (!clusterID) {
    return null;
  }

  const {
    loading,
    error,
    value,
  } = useFetch(`${ESPrefix}/${clusterID}/storage_metrics`, {}, [clusterID]);

  const config = {
    data: value || {},
    colorField: "name",
    legend: {
      position: "top-left",
    },
    tooltip: {
      formatter: (v) => {
        const root = v.path[v.path.length - 1];
        return {
          name: v.name,
          value: `${formatter.bytes(v.value)}(占比${(
            (v.value / root.value) *
            100
          ).toFixed(2)}%)`,
        };
      },
    },
    // use `drilldown: { enabled: true }` to
    // replace `interactions: [{ type: 'treemap-drill-down' }]`
    interactions: [
      {
        type: "treemap-drill-down",
      },
    ],
    // drilldown: {
    //   enabled: true,
    //   breadCrumb: {
    //     rootText: '初始',
    //   },
    // },
    // 开启动画
    animation: {},
  };

  return (
    <div id="storage-metric">
      <div className="px">
        <Treemap {...config} />
      </div>
    </div>
  );
};
