import { Pie } from "@ant-design/charts";
import { useMemo } from "react";

export default (props: any) => {

    const { data, options } = props;

    if (!options.seriesField) return null;
    
    const formatData = useMemo(() => {
      const newData = {}
      data.forEach((item) => {
        if (!newData[item[options.seriesField]]) {
          newData[item[options.seriesField]] = 0
        }
        newData[item[options.seriesField]] += item[options.yField]
      })
      const keys = Object.keys(newData)
      return keys.map((item) => ({
        group: item,
        value: newData[item]
      }))
    }, [data])

    const defaultOptions = {
      autoFit: true,
      padding: 'auto',
      smooth: true,
      animation: false,
      angleField: options.yField,
      colorField: options.seriesField,
      radius: 0.9,
      label: {
        type: 'inner',
        offset: '-30%',
        content: ({ percent }: any) => `${(percent * 100).toFixed(1)}%`,
        style: {
          fontSize: 14,
          textAlign: 'center',
        },
      },
    }
  
    return (
      <Pie 
        {...defaultOptions} 
        data={formatData} 
        {...options}
      />
    )
  }