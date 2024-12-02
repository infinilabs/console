import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { Form, Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import HideWizard from "../../HideWizard";

export default (props) => {

    const { form, globalQueries, customQueries, isGlobalDataSource, isGlobalTimeField, setIsGlobalTimeField } = props;

    const { getFieldDecorator } = form;

    const [fields, setFields] = useState({});

    const queries = useMemo(() => {
        if (isGlobalDataSource) {
            return {
                cluster_id: globalQueries.cluster_id,
                indices: globalQueries.indices
            }
        } else {
            return {
                cluster_id: customQueries.cluster_id,
                indices: customQueries.indices
            }
        }
    }, [globalQueries, customQueries, isGlobalDataSource])

    const { cluster_id, indices } = queries; 

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
        fetchFields({
            size: 10,
            pattern: (indices || []).join(','),
            es_type: "date",
            state_key: "metric_date_field",
        }, cluster_id);
    }, [JSON.stringify(indices), cluster_id])

    return (
        <>
            <HideWizard visible={isGlobalDataSource}>
                {getFieldDecorator('isGlobalTimeField', {
                    initialValue: isGlobalTimeField,
                })(
                    <Select onChange={setIsGlobalTimeField} style={{ width: '100%' }}>
                        <Select.Option value={true}>
                            Use Dashboard's Setting
                        </Select.Option>
                        <Select.Option value={false}>
                            Custom
                        </Select.Option>
                    </Select>
                )}
            </HideWizard>
            <HideWizard visible={!isGlobalTimeField}>
                {getFieldDecorator('time_field', {
                    initialValue: customQueries.time_field,
                })(
                    <Select
                        allowClear
                        showSearch
                        placeholder="Type to search time field"
                        style={{width: '100%'}}
                        dropdownMatchSelectWidth={false}
                        onSearch={(value) => {
                            if (value && value <= 2) {
                                return;
                            }
                            fetchFields({
                                size: 10,
                                keyword: value,
                                pattern: (indices || []).join(','),
                                es_type: "date",
                                state_key: "time_field",
                            }, cluster_id)
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
            </HideWizard>
        </>
    )
}