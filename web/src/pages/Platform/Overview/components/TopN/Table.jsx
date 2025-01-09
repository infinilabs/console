import { Treemap } from "@ant-design/charts";
import { Table } from "antd";
import { useMemo } from "react";
import { formatMessage } from "umi/locale";

export default (props) => {

  const { type, config = {}, data = [] } = props
  const { 
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
      newColumns.push({
        title: sourceArea.unit ? `${sourceArea.name}(${sourceArea.unit})` : sourceArea.name,
        dataIndex: 'value',
        key: 'value',
        defaultSortOrder: 'descend',
        sorter: (a, b) => a['value'] - b['value'],
      })
    }
    if (sourceColor) {
      newColumns.push({
        title: sourceColor.unit ? `${sourceColor.name}(${sourceColor.unit})` : sourceColor.name,
        dataIndex: 'valueColor',
        key: 'valueColor',
        sorter: (a, b) => a['valueColor'] - b['valueColor'],
      })
    }
    return newColumns
  }, [sourceArea, sourceColor])

  return (
    <Table 
      columns={columns} 
      dataSource={data} 
      size="small"
    />
  )
}