import { Bar } from "@ant-design/charts";
import { useMemo } from "react";
import { getXYOptions } from "..";

export default (props) => {

    const { record, result, options, isGroup, onReady, bucketSize, isTimeSeries } = props;

    const { series = [], is_stack, is_percent, legend } = record;

    const config = {
      ...getXYOptions(result, record, { isGroup, bucketSize, xyReverse: true, isTimeSeries, legend }),
      maxBarWidth: 40,
      isGroup: true,
      isStack: false,
      isPercent: false,
    }

    if (is_stack) {
      config.isStack = true;
      config.isGroup = false;
      if (is_percent) {
        config.isPercent = true;
        config.xAxis.label.formatter = (value) => `${value * 100}%`
      }
    }

    return (
      <div style={{ width: '100%', height: '100%'}}>
        <Bar {...config} onReady={onReady}/>
      </div>
    )
}