import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { Form, Icon, Input, InputNumber, Select, Table } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";
import styles from "./Source.less";
import { DndProvider, DragSource, DropTarget } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DataSource from "@/pages/DataManagement/View/components/FormItems/DataSource";

let dragingIndex = -1;
let focusIndex = -1

class BodyRow extends React.Component {
  render() {
    const { isOver, connectDragSource, connectDropTarget, moveRow, ...restProps } = this.props;
    const style = { ...restProps.style, cursor: 'move' };

    const { className } = restProps;

    if (focusIndex === restProps.index) {
        return <tr {...restProps} className={className} style={style} />
    }

    return connectDragSource(
      connectDropTarget(<tr {...restProps} className={className} style={style} />),
    );
  }
}

const rowSource = {
  beginDrag(props) {
    dragingIndex = props.index;
    return {
      index: props.index,
    };
  },
};

const rowTarget = {
    drop(props, monitor) {
      const dragIndex = monitor.getItem().index;
      const hoverIndex = props.index;
  
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
  
      // Time to actually perform the action
      props.moveRow(dragIndex, hoverIndex);
  
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      monitor.getItem().index = hoverIndex;
    },
};

const DragableBodyRow = DropTarget('row', rowTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
}))(
    DragSource('row', rowSource, connect => ({
        connectDragSource: connect.dragSource(),
    }))(BodyRow),
);

export const ColumnsSelect = (props) => {
    const { value = [], onChange, indices, clusterId, width = '100%' } = props;

    const [objectFields, setObjectFields] = useState({});

    const [refresh, setRefresh] = useState();

    const onSearchObjectFields = (obj) => {
        if (!obj.keyword || obj.keyword.length <= 2) {
            return;
        }
        delete obj.es_type
        delete obj.aggregatable;
        fetchObjectFields({
            pattern: indices?.join(','),
            size: 10,
            ...obj 
        }, clusterId);
    };

    const fetchObjectFields = async (queryParams, selectedClusterId) => {
        if (queryParams.pattern && selectedClusterId) {
            const res = await request(
                `${ESPrefix}/${selectedClusterId}/view/_fields_for_wildcard`,
                {
                  method: "GET",
                  queryParams,
                }
              );
              if (res?.fields) {
                setObjectFields({ 
                    ...objectFields,
                    [queryParams.state_key]: res.fields.map((item) => ({
                        name: item.name,
                        label: item.name,
                        type: item.type,
                    }))
                });
              }
        }
    };

    const onAdd = (name, fields) => {
        const newValue = value.map((item) => ({...item}));
        if (newValue.find((item) => item.name === name)) {
            return;
        }
        const field = fields.find((item) => item.name === name)
        if (!field) return;
        newValue.push({
            name,
            type: field.type,
        })
        onChange(newValue)
    }

    const onDelete = (index) => {
        const newValue = value.map((item) => ({...item}));
        newValue.splice(index, 1)
        onChange(newValue)
    }

    const moveRow = (dragIndex, hoverIndex) => {
        const newValue = value.map((item) => ({...item}))
        const dragRow = newValue[dragIndex];
        const hoverRow = newValue[hoverIndex];
        newValue.splice(dragIndex, 1);
        let newHoverIndex = newValue.findIndex((item) => item.name === hoverRow.name)
        if (dragIndex < hoverIndex) {
            newHoverIndex += 1
        }
        newValue.splice(newHoverIndex, 0, dragRow);
        onChange(newValue)
    };

    const onDisplayChange = (display, index) => {
        const newValue = value.map((item) => ({...item}))
        newValue[index].display = display
        onChange(newValue)
    }

    const onFormatterChange = (formatter, index) => {
        const newValue = value.map((item) => ({...item}))
        newValue[index].formatter = formatter
        onChange(newValue)
    }

    const onOrderChange = (order, index) => {
        const newValue = value.map((item) => ({...item}))
        newValue[index].order = order
        onChange(newValue)
    }

    useEffect(() => {
        fetchObjectFields({
            pattern: indices?.join(','),
            size: 10,
            es_type: "keyword",
            state_key: "metric_keyword_field",
        }, clusterId);
    }, [JSON.stringify(indices), clusterId])

    const fields = (objectFields['metric_search_field'] || objectFields['metric_keyword_field']) || [];
    const filterFields = fields.filter((item) => !value.find((v) => v.name === item.name))

    return (
        <div style={{ width }}>
            <Select
                showSearch
                allowClear
                placeholder="Select to add column"
                onSearch={(value) => {
                    onSearchObjectFields({
                        keyword: value,
                        state_key: "metric_search_field",
                    })
                }}
                onSelect={(name) => onAdd(name, filterFields)}
                style={{ width: "100%" }}
                value={undefined}
            >
                {filterFields.map((item, i) => {
                    return (
                        <Select.Option key={item.name} value={item.name}>
                            {item.label}
                        </Select.Option>
                    );
                })}
            </Select>
            <DndProvider backend={HTML5Backend}>
                <Table
                    key={refresh}
                    rowKey={"name"}
                    className={styles.columns}
                    size="small"
                    bordered={false}
                    columns={[
                        {
                          title: 'Name',
                          dataIndex: 'name',
                          key: 'name',
                          ellipsis: true,
                          width: '35%',
                        },
                        {
                          title: 'Display',
                          dataIndex: 'display',
                          key: 'display',
                          width: '35%',
                          render: (value, record, index) => (
                            <Input 
                                value={value} 
                                onChange={(e) => onDisplayChange(e.target.value, index)}
                                onFocus={() => {
                                    focusIndex = index
                                }}
                                onBlur={() => {
                                    setRefresh(new Date().valueOf())
                                    focusIndex = -1
                                }}
                                style={{ width: "100%" }}
                            />
                          )
                        },
                        {
                            title: 'Formatter',
                            dataIndex: 'formatter',
                            key: 'formatter',
                            width: 100,
                            render: (value, { type }, index) => {
                                const options = [(
                                    <Select.Option key="" value={""}>
                                        Default
                                    </Select.Option>
                                )]
                                if (type === 'date') {
                                    options.push((
                                        <Select.Option key="date" value={"date"}>
                                            Date
                                        </Select.Option>
                                    ))
                                }
                                if (type === 'number') {
                                    options.push((
                                        <Select.Option key="number" value={"number"}>
                                            {formatMessage({id: "dashboard.widget.config.general.formatter.number"})}
                                        </Select.Option>
                                    ),(
                                        <Select.Option key="bytes" value={"bytes"}>
                                            {formatMessage({id: "dashboard.widget.config.general.formatter.bytes"})}
                                        </Select.Option>
                                    ),(
                                        <Select.Option key="percent" value={"percent"}>
                                            {formatMessage({id: "dashboard.widget.config.general.formatter.percent"})}
                                        </Select.Option>
                                    ))
                                }
                                return (
                                    <Select style={{ width: "100%" }} value={value || ""} onChange={(value) => onFormatterChange(value, index)}>
                                        {options}
                                    </Select>
                                )
                            }
                        },
                        {
                            title: 'Order',
                            dataIndex: 'order',
                            key: 'order',
                            width: 100,
                            render: (value, _, index) => {
                                return (
                                    <Select style={{ width: "100%" }} value={value || ""} onChange={(value) => onOrderChange(value, index)}>
                                        <Select.Option key="" value={""}>
                                            Default
                                        </Select.Option>
                                        <Select.Option key="" value={"desc"}>
                                            Desc
                                        </Select.Option>
                                        <Select.Option key="" value={"asc"}>
                                            Asc
                                        </Select.Option>
                                    </Select>
                                )
                            }
                        },
                        {
                            title: 'Action',
                            key: 'action',
                            width: 70,
                            render: (value, record, index) => (
                                <Icon type="close-circle" onClick={() => onDelete(index)} />
                            )
                        }
                      ]}
                    dataSource={value}
                    components={{
                        body: {
                          row: DragableBodyRow,
                        },
                    }}
                    onRow={(record, index) => ({
                        index,
                        moveRow,
                    })}
                    pagination={false}
                />
            </DndProvider>
        </div>
    )
}

export default (props) => {

    const { form, clusterId, indices = [], pageSize, record } = props;
    const { getFieldDecorator } = form;

    const { page_size, series } = record;

    const { columns = [] } = series[0] || {}

    return (
        <>
            <DataSource {...props}/>
            <Form.Item label="Display Columns">
                {getFieldDecorator("columns", {
                    initialValue: columns.length > 0 ? columns : [],
                })(
                    <ColumnsSelect indices={indices} clusterId={clusterId} width={"calc(100% - 28px)"}/>
                )}
            </Form.Item>
        </>
    )
}