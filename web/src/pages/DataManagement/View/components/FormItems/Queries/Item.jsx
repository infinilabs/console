import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { Form, Input, Select } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";

export default (props) => {

    const { title, form, initialValues = {}, clusterList } = props;

    const { getFieldDecorator } = form;

    const { cluster_id, indices, time_field, query } = initialValues; 

    const [IndexList, setIndexList] = useState([]);

    const [fields, setFields] = useState({});

    const fetchIndices = async (clusterId) => {
        if (!clusterId) {
          return;
        }
        const res = await request(`/elasticsearch/${clusterId}/internal/view-management/resolve_index/*?expand_wildcards=all`)
        if (res) {
            const newIndices =  [
                ...((res.aliases || []).map((item) => ({ index: item.name }))),
                ...((res.indices || []).map((item) => ({ index: item.name })))
            ]
            setIndexList(newIndices);
        } else {
            setIndexList([]);
        }
    };

    const fetchFields = async (queryParams, selectedClusterId) => {
        if (queryParams.pattern && selectedClusterId) {
            const res = await request(
                `${ESPrefix}/${selectedClusterId}/view/_fields_for_wildcard`,
                {
                  method: "GET",
                  queryParams,
                }
              );
              if (res?.fields) {
                const newFields = { 
                    ...fields, 
                    [queryParams.state_key]: res.fields.map((item) => ({
                        name: item.name,
                        label: item.name,
                        type: item.type,
                    }))
                }
                setFields({ 
                    ...fields, 
                    [queryParams.state_key]: res.fields.map((item) => ({
                        name: item.name,
                        label: item.name,
                        type: item.type,
                    }))
                });
              }
        }
    };

    useEffect(() => {
        fetchIndices(cluster_id.value)
    }, [cluster_id.value])

    useEffect(() => {
        fetchFields({
            size: 10,
            pattern: (indices.value || []).join(','),
            es_type: "date",
            state_key: "metric_date_field",
        }, cluster_id.value);
    }, [JSON.stringify(indices.value), cluster_id.value])

    return (
        <>
            <Form.Item label={" "} >
                <span style={{fontWeight: 500}}>{title}</span>
            </Form.Item>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.source.cluster"})}>
                {getFieldDecorator(cluster_id.name, {
                    initialValue: cluster_id.value,
                })(
                    <Select
                        allowClear
                        showSearch
                        disabled={cluster_id.disabled || false}
                        optionFilterProp={'name'}
                        onChange={(value) => {
                            cluster_id.onChange && cluster_id.onChange(value)
                            form.setFieldsValue({ 
                                [indices.value]: undefined,
                                [time_field.name]: undefined,
                            })
                        }}
                    >
                        {clusterList.map((item, i) => {
                            return (
                                <Select.Option name={item.name} key={i} value={item.id}>
                                    {item.name}
                                </Select.Option>
                            );
                        })}
                    </Select>
                )}
            </Form.Item>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.source.indices"})}>
                {getFieldDecorator(indices.name, {
                    initialValue: indices.value || [],
                })(
                    <Select
                        allowClear
                        showSearch
                        placeholder="Type to search indices"
                        mode="tags"                    
                        disabled={indices.disabled || false}
                        onChange={(value) => {
                            indices.onChange && indices.onChange(value)
                            form.setFieldsValue({ [time_field.name]: undefined })
                        }}
                    >
                        {IndexList.map((item, i) => {
                            return (
                                <Select.Option key={i} value={item.index}>
                                    {item.index}
                                </Select.Option>
                            );
                        })}
                    </Select>
                )}
            </Form.Item>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.source.time.field"})}>
                {getFieldDecorator(time_field.name, {
                    initialValue: time_field.value,
                })(
                    <Select
                        allowClear
                        showSearch
                        placeholder="Type to search time field"
                        disabled={time_field.disabled || false}
                        onSearch={(value) => {
                            if (value && value <= 2) {
                                return;
                            }
                            fetchFields({
                                size: 10,
                                keyword: value,
                                pattern: (indices.value || []).join(','),
                                es_type: "date",
                                state_key: "time_field",
                            }, cluster_id.value)
                        }}
                        onChange={(value) => {
                            time_field.onChange && time_field.onChange(value)
                        }}
                    >
                        {(fields?.time_field || fields?.metric_date_field)?.map((item, i) => {
                            return (
                                <Select.Option key={i} value={item.name}>
                                    {item.label}
                                </Select.Option>
                            );
                        })}
                    </Select>
                )}
            </Form.Item>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.source.query"})}>
                {getFieldDecorator(query.name, {
                    initialValue: query.value,
                })(
                    <Input.TextArea 
                        autoSize={{minRows: 1, maxRows: 6}}
                        disabled={query.disabled || false}
                        onChange={(e) => {
                            query.onChange && query.onChange(e.target.value)
                        }}
                    />
                )}
            </Form.Item>
        </>
    )
}