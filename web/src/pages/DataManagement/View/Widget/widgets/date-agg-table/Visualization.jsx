import { useEffect, useRef, useState } from "react";
import styles from "./Visualization.less"
import { Dropdown, Icon, Menu, Table } from "antd";
import moment from "moment";
import { TYPE_DATA_DRILLING, TYPE_FIELD_FILTER, TYPE_RANGE_FILTER } from "../../../components/ContextMenu";
import { formatMessage } from "umi/locale";
import Fork from "@/components/Icons/Fork";
import { generateFilter } from "../../../components/QueriesBar/generate_filters";
import { cloneDeep } from "lodash";
import DropdownMenu from "../../../components/DropdownMenu";
import SelectAndZoom from "@/components/Icons/SelectAndZoom";
import { formatValueByConfig } from "..";

export default (props) => {

    const { record, result, options, isGroup, isLock, onReady, bucketSize, currentQueries, handleContextMenu } = props;

    const { id, series = [], page_size, drilling = {}, format } = record;

    const { metric = {} } = series[0] || {}

    const { groups = [] } = metric;

    const columns = [];

    const { indices = [], time_field, range, filters: globalFilters = [] } = currentQueries;

    const [tableState, setTableState] = useState({ sortedInfo: {
      order: 'descend',
      columnKey: 'timestamp',
    }})

    const handleChange = (pagination, filters, sorter) => {
      setTableState({ ...tableState, sortedInfo: sorter });
    };

    const { sortedInfo } = tableState

    const dataSource = result?.data ? result.data.map((item, index) => ({
      ...item, value: item.value, format: formatValueByConfig(item.value, format),rowKey: index
    })) : []
    
    columns.push({
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      sorter: (a, b) => a.timestamp - b.timestamp,
      sortOrder: sortedInfo.columnKey === 'timestamp' && sortedInfo.order,
      render: (value) => {
        const formatValue = moment(value).format('YYYY-MM-DD HH:mm:ss.SSS');
        if (isLock) return formatValue;
        return (
          <DropdownMenu menu={[
              {
                type: TYPE_RANGE_FILTER,
                name: formatMessage({id: "dashboard.widget.sub.menu.range.filter"}),
                icon: <Icon component={SelectAndZoom} />,
                onClick: () => handleContextMenu({range: {
                  from: value,
                  to: value,
                }}, TYPE_RANGE_FILTER),
              },
              { 
                type: TYPE_DATA_DRILLING,
                name: formatMessage({id: "dashboard.widget.sub.menu.data.drilling"}),
                icon: <Icon component={Fork} />,
                onClick: () => {
                  if (!drilling.url) return;
                  const urlParams = {}
                  const range = {
                    from: value,
                    to: value,
                  }
                  if (range.from && range.to) {
                    urlParams.from = moment(range.from).toISOString()
                    urlParams.to = moment(range.to).toISOString()
                  }
                  handleContextMenu(urlParams, TYPE_DATA_DRILLING)
                },
                disabled: !drilling.url
              }
          ]}>
            <span className={styles.value}>{formatValue}</span>
          </DropdownMenu>
        )
      },
    })

    if (dataSource[0]?.groupMapping) {
      columns.push({
        title: 'Group',
        dataIndex: 'groupMapping',
        key: 'groupMapping',
      })
    }

    if (isGroup && groups.length > 0) {
      groups.forEach((item, index) => {
        columns.push({
          title: item.name || item.field,
          dataIndex: `groups.[${index}]`,
          key: `groups.[${index}]`,
          render: (value) => {
            if (isLock) return value;
            return (
              <DropdownMenu menu={[
                  { 
                    type: TYPE_FIELD_FILTER,
                    name: formatMessage({id: "dashboard.widget.sub.menu.field.filter"}),
                    icon: <Icon type="filter" />,
                    onClick: () => {
                      const cloneFilters = cloneDeep(globalFilters);
                      const newFilters = generateFilter(
                        cloneFilters,
                        item.field,
                        value,
                        '+',
                        undefined
                      )
                      handleContextMenu({filters: newFilters}, TYPE_FIELD_FILTER)
                    },
                  },
                  { 
                    type: TYPE_DATA_DRILLING,
                    name: formatMessage({id: "dashboard.widget.sub.menu.data.drilling"}),
                    icon: <Icon component={Fork} />,
                    onClick: () => {
                      if (!drilling.url) return;
                      const urlParams = {[item.field]: value}
                      handleContextMenu(urlParams, TYPE_DATA_DRILLING)
                    },
                    disabled: !drilling.url
                  }
              ]}>
                <span className={styles.value}>{value}</span>
              </DropdownMenu>
            )
          }
        })
      })
    }

    columns.push({
      title: metric.name || 'Metric',
      dataIndex: 'value',
      key: 'value',
      sorter: (a, b) => a.value - b.value,
      sortOrder: sortedInfo.columnKey === 'value' && sortedInfo.order,
      render: (value, record) => record.format || value
    })

    return (
      <div className={styles.table}>
        <Table 
          rowKey={"rowKey"}
          size="small" 
          dataSource={dataSource} 
          columns={columns} 
          onChange={handleChange}
          pagination={{ pageSize: page_size }}
        />
      </div>
    )
}