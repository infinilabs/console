import { getFormatter } from "@/utils/format";
import { Treemap } from "@ant-design/charts";
import { Table } from "antd";
import { useMemo } from "react";
import { formatMessage } from "umi/locale";
import { fixFormatter } from "./Chart";

export default (props) => {

  const { type, config = {}, data = [] } = props
  const { 
    top,
    statisticArea,
    statisticColor,
    sourceArea,
    sourceColor,
  } = config;

  const columns = useMemo(() => {
    const newColumns = [{
      title: formatMessage({ id: `cluster.monitor.${type}.title` }) ,
      dataIndex: 'displayName',
      key: 'displayName',
    }];
    if (sourceArea) {
      const { format: formatArea, pattern: patternArea, unit: unitArea } = sourceArea || {}
      const formatterArea = fixFormatter(formatArea, patternArea)
      newColumns.push({
        title: unitArea ? `${sourceArea.name}(${unitArea})` : sourceArea.name,
        dataIndex: 'value',
        key: 'value',
        defaultSortOrder: 'descend',
        sorter: (a, b) => a['value'] - b['value'],
        render: (value) => formatterArea ? formatterArea(value) : value
      })
    }
    if (sourceColor) {
      const { format: formatColor, pattern: patternColor, unit: unitColor } = sourceColor
      const formatterColor = fixFormatter(formatColor, patternColor)
      newColumns.push({
        title: unitColor ? `${sourceColor.name}(${unitColor})` : sourceColor.name,
        dataIndex: 'valueColor',
        key: 'valueColor',
        sorter: (a, b) => a['valueColor'] - b['valueColor'],
        render: (value) => formatterColor ? formatterColor(value) : value
      })
    }
    return newColumns
  }, [sourceArea, sourceColor])

  return (
    <Table 
      columns={columns} 
      dataSource={data} 
      size="small"
      pagination={{
        pageSize: top <= 20 ? top : 20
      }}
    />
  )
}