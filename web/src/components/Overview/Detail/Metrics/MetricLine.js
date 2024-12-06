import { Line } from "@ant-design/plots";
import { formatter as formatHelper } from "@/utils/format";
import { isFloat } from "@/utils/utils";
import styles from "./index.scss";

export default (props) => {
  const x_field = props.xField || "x";
  const y_field = props.yField || "y";
  const series_field = props.seriesField || "category";
  const y_units = props.yUnits || "";
  const config = {
    data: props.data || [],
    xField: x_field,
    yField: y_field,
    seriesField: series_field,
    animation: false,
    xAxis: {
      label: {
        // x轴不显示值
        formatter: (v) => {},
      },
    },
    yAxis: {
      label: {
        // y轴数值格式化
        formatter: (v) => {
          // `${v}`.replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`),
          if (y_units.indexOf("bytes") > -1) {
            return formatHelper.bytes(v);
          }
          return v;
        },
      },
    },
    tooltip: {
      formatter: (v) => {
        let value = v[y_field];
        if (y_units.indexOf("bytes") > -1) {
          value = formatHelper.bytes(value);
        } else {
          if (isFloat(value)) {
            value = value.toFixed(2);
          }
        }

        return { name: v[series_field], value: value };
      },
    },
  };
  return (
    <div className={styles.chartBody}>
      <Line {...config} />
    </div>
  );
};
