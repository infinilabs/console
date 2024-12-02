import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { Button, Form, Input, Select, Tabs } from "antd"
import { Fragment, useEffect, useState } from "react";
import { formatMessage } from "umi/locale";
import { cloneDeep } from "lodash";
import MutipleMetrics from "./Item";

export default (props) => {

    const { form, clusterId, indices = [], record } = props;

    const { series = [], bucket_size = 'auto', group_mapping = {} } = record;

    const { getFieldDecorator } = form;

    const [objectFields, setObjectFields] = useState({});

    const [activeKey, setActiveKey] = useState('0')

    const [ seriesCache, setSeriesCache] = useState(series);

    const { metric = {}, type, queries = {} } = seriesCache[0] || {}
    const { groups = [], items = [], formula, name, sort } = metric;

    const onSearchObjectFields = (obj) => {
        if (!obj.keyword || obj.keyword.length <= 2) {
            return;
        }
        delete obj.es_type
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

    useEffect(() => {
        fetchObjectFields({
            pattern: indices?.join(','),
            size: 10,
            aggregatable: true,
            es_type: "keyword",
            state_key: "metric_keyword_field",
        }, clusterId);
    }, [indices, clusterId])

    useEffect(() => {
        setSeriesCache(series)
    }, [JSON.stringify(series)])

    return (
        <Form.Item label={formatMessage({id: "dashboard.widget.config.source.metrics"})}>
            {
                getFieldDecorator(`metrics`, {
                    initialValue: series.map((item) => item.metric) || [],
                    rules: [{ validator: (rule, value, callback) => {
                        if (value.some((item) => {
                            const { items = [] } = item;
                            return items.some((metric) => !metric.field)
                        })) {
                            callback('Metric field must not be empty!');
                        }
                        if (value.some((item) => {
                            const { items = [] } = item;
                            return items.some((metric) => !metric.statistic)
                        })) {
                            callback('Statistic must not be empty!');
                        }
                        return callback();
                    }}],
                    validateTrigger: "submit"
                })(
                    <MutipleMetrics
                        objectFields={objectFields}
                        onSearchObjectFields={onSearchObjectFields}
                    />
                )
            }
        </Form.Item>
    )
}