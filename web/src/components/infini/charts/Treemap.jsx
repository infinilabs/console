import { Treemap } from "@ant-design/plots";
import { formatMessage } from "umi/locale";

export default ({
  data = {},
  colorField = "name",
  drilldownEnabled = true,
  unit = "",
  extendConfig = {},
}) => {
  const defaultConfig = {
    data: data || {},
    colorField: colorField,
    autoFit: true,
    legend: {
      position: "top-left",
    },
    tooltip: {
      formatter: (v) => {
        const root = v.path[v.path.length - 1];
        return {
          name: v.name,
          value: `${v.value.toFixed(2)} ${unit} (${formatMessage({
            id: "cluster.metrics.treemap.tooltip.formatter.value.percent",
          })}${((v.value / root.value) * 100).toFixed(2)}%) ${v.description ??
            ""}`,
        };
      },
    },
    drilldown: {
      enabled: drilldownEnabled,
      breadCrumb: {
        rootText: formatMessage({
          id: "cluster.metrics.treemap.drilldown.breadCrumb.rootText",
        }),
      },
    },
    // 开启动画
    animation: {},
  };
  const mergedConfg = { ...defaultConfig, ...extendConfig };

  return (
    <div>
      <Treemap {...mergedConfg} />
    </div>
  );
};
