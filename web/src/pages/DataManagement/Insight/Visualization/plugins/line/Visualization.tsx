import { Line } from "@ant-design/charts";
import moment from "moment";
import { useMemo } from "react";
import { findMaxUnit } from "../utils";

export default (props: any) => {

    const { data, options } = props;
  
    const defaultOptions = {
      autoFit: true,
      padding: 'auto',
      smooth: true,
      animation: false,
    }

    const formatter = useMemo(() => {
      return findMaxUnit(data)
    }, [data])
  
    return (
      <Line 
        {...defaultOptions} 
        data={data} 
        {...options}
        yAxis={{
          label: {
            formatter: (value: number) => {
              if (!formatter || !value) return value;
              const { factor, unit } = formatter;
              return `${(value / factor).toFixed(0)} ${unit}`;
            },
          },
        }}
        xAxis={{
          tickCount: 5,
          label: {
            autoHide: true,
            autoRotate: false,
            formatter: (value: number) => moment.unix(value / 1000).format("YYYY-MM-DD HH:mm:ss"),
          },
        }}
      />
    )
  }