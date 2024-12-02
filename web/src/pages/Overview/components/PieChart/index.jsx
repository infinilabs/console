import { Pie } from "@ant-design/charts";
import { useMemo } from "react";
import * as Color from "@/components/infini/color";

export default (props) => {
  const { data } = props;

  const filterData = data.filter((item) => !!item.value);

  const color = filterData.map((item) => item.color).filter((item) => !!item);

  const config = {
    color:
      color.length !== 0
        ? color
        : [Color.GREEN, Color.YELLOW, Color.RED, Color.GREY],
    autoFit: true,
    padding: 2,
    smooth: true,
    animation: false,
    angleField: "value",
    colorField: "group",
    radius: 1,
    innerRadius: 0.6,
    legend: false,
    label: false,
    interactions: [
      {
        type: "element-active",
      },
    ],
    statistic: {
      title: false,
    },
    data: filterData,
    state: {
      active: {
        style: {
          lineWidth: 0,
          cursor: "pointer",
        },
      },
    },
  };

  return <Pie {...config} />;
};
