import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { Form, Input, Select } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";

export default (props) => {

    const { title, form, initialValues = {}, clusterList } = props;

    const { getFieldDecorator } = form;

    const { cluster_id, indices, query } = initialValues; 

    const [IndexList, setIndexList] = useState([]);

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

    useEffect(() => {
        fetchIndices(cluster_id.value)
    }, [cluster_id.value])

    return (
        <>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.source.cluster"})}>
                {getFieldDecorator(cluster_id.name, {
                    initialValue: cluster_id.value,
                    rules: [
                        cluster_id.disabled ? {} : {
                          required: true,
                          message: "Please select cluster!",
                        },
                    ],
                })(
                    <Select
                        allowClear
                        showSearch
                        disabled={cluster_id.disabled || false}
                        optionFilterProp={'name'}
                        onChange={(value) => {
                            cluster_id.onChange && cluster_id.onChange(value)
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
                    initialValue: indices.value,
                    rules: [
                        indices.disabled ? { required: false } : {
                          required: true,
                          message: "Please select indices!",
                        },
                    ],
                })(
                    <Select
                        allowClear
                        showSearch
                        placeholder="Type to search indices"
                        mode="tags"                    
                        disabled={indices.disabled || false}
                        onChange={(value) => {
                            indices.onChange && indices.onChange(value)
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
        </>
    )
}