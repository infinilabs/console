import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./index.less"
import request from "@/utils/request";
import { ESPrefix } from "@/services/common";
import { Button, Icon, Input, Select } from "antd";
import FormAlertMetric from "@/pages/Alerting/Rule/FormAlertMetric";
import Sliders from "@/components/Icons/Sliders";
import Monitor from "@/components/Icons/Monitor";
import Sum from "@/components/Icons/Sum";
import FolderChart from "@/components/Icons/FolderChart";
import { FieldIcon } from "@/components/vendor/react/public";
import { getFieldTypeName } from "@/components/vendor/discover/public/application/components/field_name/field_type_name";
import { WIDGETS } from "../../Widget/widgets";
import CopyTextIcon from "../CopyTextIcon";

export default (props) => {

    const { globalQueries, record, clusterList, clusterStatus, onChange, onReset, visible, onVisibleChange } = props;

    const { indices: globalIndices, cluster_id: globalClusterId } = globalQueries;

    const { id, title, bucket_size, series = [] } = record;
    const { metric = {}, type, queries = {} } = series[0] || {}

    const { items = [], formula } = metric;

    const clusterId = queries.cluster_id || globalQueries.cluster_id;
    const indices = (queries.cluster_id ? queries.indices : globalQueries.indices) || [];

    const [objectFields, setObjectFields] = useState({});

    const [fieldType, setFieldType] = useState();

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
                return res?.fields;
              }
              return [];
        }
    };

    const getFunctions = (type) => {
        if (type == "string") {
          return ["count",  "cardinality"];
        }
        return [
          "count",
          "cardinality",
          "avg",
          "max",
          "min",
          "sum",
          "medium",
          "derivative",
          "p99",
          "p95",
          "p90",
          "p80",
          "p50",
          "latest"
        ];
    };

    useEffect(() => {
        if (visible) {
            fetchObjectFields({
                pattern: indices?.join(','),
                size: 10,
                es_type: "keyword",
                aggregatable: true,
                state_key: "metric_keyword_field",
            }, clusterId);
        }
    }, [JSON.stringify(indices), clusterId, visible])

    const fields = objectFields['metric_search'] || objectFields['metric_keyword_field'] || []

    const item = items[0] || {}

    useEffect(() => {
        if (visible) {
            if (!item.field) return;
            if (item.field !== '*') {
                (async ()=>{
                    const fields = await fetchObjectFields({
                        pattern: indices?.join(','),
                        size: 10,
                        // es_type: "keyword",
                        keyword: item.field,
                        state_key: "current_metric_field",
                    }, clusterId);
                    if(fields.length > 0 && fields[0].name == item.field){
                        setFieldType(fields[0].type)
                    }
                })();
                
            }
        }
    }, [item.field, clusterId, visible])

    const widgetPlugin = useMemo(() => {
        return WIDGETS.find((item) => item.type === type)
    }, [type])

    if (items.length !== 1) {
        return null
    }

    const icon = (
        <div className={styles.icon}>
            <Icon 
                style={{ color: visible ? 'rgb(2, 127, 254)' : 'rgb(16, 16, 16)' }} 
                component={Sliders} 
                onClick={() => onVisibleChange(!visible)}
            />
        </div>
    )

    return (
        <div className={styles.quickBar}>
            {
                visible ? (
                    <div className={styles.content}>
                        <div className={styles.form}>
                            <div className={styles.select} style={{ width: 'calc((100% - 4px) / 5 * 3)' }}>
                                <Icon className={styles.prefix} component={Monitor}/>
                                <Select
                                    allowClear
                                    showSearch
                                    style={{ width: 'calc((100% - 30px)' }}
                                    dropdownClassName={styles.quickBarMetrics}
                                    dropdownMatchSelectWidth={false}
                                    value={item.field}
                                    onSearch={(value) =>{
                                        onSearchObjectFields({
                                            keyword: value,
                                            aggregatable: true,
                                            state_key: `metric_search`,
                                        })
                                    }}
                                    placeholder={"Type to search field"}
                                    onChange={(value, option) => {
                                        const type = option?.props?.type || "string"
                                        const func = getFunctions(type)
                                        const newSeries = {
                                            ...(series[0] || {}),
                                            metric: {
                                                ...(series[0]?.metric || {}),
                                                items: [{
                                                    ...item,
                                                    field: value,
                                                    statistic: func.includes(item.statistic) ? item.statistic : func[0]
                                                }]
                                            }
                                        }
                                        onChange(newSeries)
                                        setFieldType(type);
                                    }}
                                    clearIcon={<CopyTextIcon text={item.field} />}
                                >
                                    {
                                        fields.length > 0 && (
                                            <Select.Option key={"*"} value={"*"} type={"string"}>
                                                <FieldIcon
                                                    type={"string"}
                                                    label={getFieldTypeName("string")}
                                                />
                                                {"*"}
                                            </Select.Option>
                                        )
                                    }
                                    {
                                        fields.map((item, ii) => (
                                            <Select.Option key={ii} value={item.name} type={item.type} >
                                                <FieldIcon
                                                    type={item.type}
                                                    label={getFieldTypeName(item.type)}
                                                />
                                                {item.label}
                                            </Select.Option>
                                        ))
                                    }
                                </Select>
                            </div>
                            <div className={styles.select} style={{ width: 'calc((100% - 4px) / 5 * 1)' }}>
                                <Icon className={styles.prefix} component={Sum}/>
                                <Select
                                    showSearch
                                    style={{ width: 'calc((100% - 30px)' }}
                                    dropdownMatchSelectWidth={false}
                                    placeholder={"function"}
                                    value={item.statistic}
                                    onChange={(value) => {
                                        const newSeries = {
                                            ...(series[0] || {}),
                                            metric: {
                                                ...(series[0]?.metric || {}),
                                                items: [{
                                                    ...item,
                                                    statistic: value
                                                }]
                                            }
                                        }
                                        onChange(newSeries)
                                    }}
                                >
                                    {getFunctions(fieldType || 'string').map((item) => {
                                        return (
                                            <Select.Option key={item} value={item}>
                                                {item}
                                            </Select.Option>
                                        );
                                    })}
                                </Select>
                            </div>
                            <div className={styles.select} style={{ width: 'calc((100% - 4px) / 5 * 1)' }}>
                                <Icon className={styles.prefix} component={FolderChart}/>
                                <Select 
                                    style={{ width: 'calc((100% - 30px)' }}
                                    dropdownMatchSelectWidth={false}
                                    value={type} 
                                    onChange={(value) => {
                                        const newSeries = {...(series[0] || {})}
                                        newSeries.type = value
                                        onChange(newSeries)
                                    }}
                                >
                                    {
                                        WIDGETS.filter((item) => item.type === type || widgetPlugin?.quickBar?.changeTypes?.indexOf(item.type) !== -1).map((item) => (
                                            <Select.Option key={item.type} value={item.type}>{item.displayName}</Select.Option>
                                        ))
                                    }
                                </Select> 
                            </div>
                        </div>
                        {icon}
                    </div>
                ) : (
                    <div className={styles.iconWrapper} onClick={() => onVisibleChange(true)}>
                        {icon}
                    </div>
                )
            }
        </div>
    )
}