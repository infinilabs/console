import { formatter } from "@/utils/format";
import { Line } from "@ant-design/plots";
import styles from "./metrics.scss";
import { MetricLine } from "./metric_line";
import { formatMessage } from "umi/locale";

export const MetricLineList = ({ metrics = {} }) => {
  let newMetrics = Object.values(metrics).map((item) => {
    let key = item.key;
    let units = "";
    let newData = [];
    item.lines.map((line) => {
      let category = line.metric.label;
      if (!units) {
        if (line.metric.formatType.toLowerCase() == "bytes") {
          units = line.metric.formatType;
        } else {
          units = line.metric.units;
        }
      }

      return line.data.map((ld) => {
        newData.push({
          category: category,
          x: formatter.dateUserDefined(parseInt(ld[0])),
          y: ld[1],
        });
      });
    });
    return { key: key, data: newData, units: units, order: item.order };
  });
  newMetrics = newMetrics.sort((a, b) => a.order - b.order);

  return (
    <div className={styles.metricChart}>
      {newMetrics.map((item) => {
        let config = {
          data: item.data,
          xField: "x",
          yField: "y",
          seriesField: "category",
          title: `${formatMessage({
            id: "cluster.metrics.axis." + item.key + ".title",
          })} ${item.units ? "(" + item.units + ")" : ""}`,
          yUnits: item.units,
        };
        return <MetricLine {...config} key={item.key} />;
      })}
    </div>
  );
};
