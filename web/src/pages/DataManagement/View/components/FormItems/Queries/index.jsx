import { Form, Icon } from "antd"
import { formatMessage } from "umi/locale";
import Item from './Item';
import { useState } from "react";

export default (props) => {

    const { form, globalQueries, customQueries, record, clusterList, widget, onRecordChange } = props;

    const [isAdvanced, setIsAdvanced] = useState(false);

    const { onChange } = customQueries

    return (
        <>
            <div style={{ display: isAdvanced ? 'block' : 'none'}}>
                <Item 
                    title={formatMessage({id: "dashboard.widget.config.source.global"})}
                    form={form}
                    initialValues={{
                        cluster_id: { name: 'global_cluster_id', value: globalQueries.cluster_id, disabled: true },
                        indices: { name: 'global_indices', value: globalQueries.indices, disabled: true },
                        time_field: { name: 'global_time_field', value: globalQueries.time_field, disabled: true },
                        query: { name: 'global_query', value: globalQueries.query, disabled: true },
                    }}
                    clusterList={clusterList}
                />
                <Item 
                    title={formatMessage({id: "dashboard.widget.config.source.custom"})}
                    form={form}
                    initialValues={{
                        cluster_id: { 
                            name: 'cluster_id', 
                            value: customQueries.cluster_id,
                            onChange: (value) => {
                                onChange({
                                    cluster_id: value,
                                    indices: [],
                                    time_field: undefined
                                })
                            }
                        },
                        indices: { 
                            name: 'indices', 
                            value: customQueries.indices,
                            onChange: (value) => {
                                onChange({
                                    indices: value,
                                    time_field: undefined
                                })
                            }
                        },
                        time_field: { 
                            name: 'time_field', 
                            value: customQueries.time_field,
                            onChange: (value) => {
                                onChange({
                                    time_field: value
                                })
                            }
                        },
                        query: { 
                            name: 'query', 
                            value: customQueries.query,
                            onChange: (value) => {
                                onChange({
                                    query: value
                                })
                            }
                        },
                    }}
                    clusterList={clusterList}
                />
            </div>
            <Form.Item label={" "}>
                <a onClick={() => setIsAdvanced(!isAdvanced)}>
                    {formatMessage({id: "dashboard.widget.config.source.advanced"})}
                    <Icon style={{ marginLeft: 8, verticalAlign: '-2px' }} type={isAdvanced ? "caret-up" : "caret-down"} />
                </a>
            </Form.Item>
        </>
    )
}