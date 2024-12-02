import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { Divider, Dropdown, Form, Icon, Input, InputNumber, Menu, Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import CopyTextIcon from "../../CopyTextIcon";
import { cloneDeep } from "lodash";
import HideWizard from "../../HideWizard";

const { Option } = Select;

export const KqlFilters = (props) => {
    const { value = [{}], onChange, clusterId, indices } = props;
    const [objectFields, setObjectFields] = useState({});

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
            state_key: "metric_keyword_field",
        }, clusterId);
    }, [indices, clusterId])

    const handleChange = (v, n, i) => {
        const newValue = cloneDeep(value);
        if (!newValue[i]) newValue[i] = {};
        newValue[i][n] = v;
        onChange(newValue)
    }

    const handleAdd = ( key ) => {
        const newValue = cloneDeep(value);
        newValue.push({ logic: key })
        onChange(newValue)
    }

    const handleRemove = (index) => {
        const newValue = cloneDeep(value);
        if (index === 0) {
            newValue[0] = {}
        } else {
            newValue.splice(index, 1)
        }
        onChange(newValue)
    }

    const renderOptions = (item) => {
        if (item.type === 'string') {
            return <Option value=":">equals</Option>
        }
        return (
            [
                <Option key={"equals"} value=":">equals</Option>,
                <Option key={"gte"} value=">=">gte</Option>,
                <Option key={"gt"} value=">">gt</Option>,
                <Option key={"lt"} value="<">lt</Option>,
                <Option key={"lte"} value="<=">lte</Option>,
                <Option key={"range"} value="range">range</Option>,
            ]
        )
    }

    const fields = objectFields?.[`metrics_any`] || objectFields?.metric_keyword_field

    return (
        <>
            {
                (value?.length >0 ? value : [{}]).map((item, index) => {
                    return (
                        <>
                            { item.logic && index !== 0 && <Divider orientation="left">{item.logic}</Divider>}
                            <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center'}}>
                                <Select
                                    allowClear
                                    showSearch
                                    style={{ width: `calc(100% - 90px - ${item.operator === 'range' ? 166 : 100 }px - 48px` }}
                                    dropdownMatchSelectWidth={false}
                                    onSearch={(value) =>
                                        onSearchObjectFields({
                                            keyword: value,
                                            state_key: `metrics_any`,
                                        })
                                    }
                                    placeholder={"Type to search field"}
                                    onChange={(field, option) => {
                                        const newValue = cloneDeep(value);
                                        newValue[index].field = field;
                                        newValue[index].type = option?.props?.type || "string"
                                        newValue[index].operator = undefined
                                        onChange(newValue)
                                    }}
                                    value={item.field}
                                    clearIcon={<CopyTextIcon text={item.field} />}
                                >
                                    {fields?.map((item) => {
                                        return (
                                        <Option key={item.name} value={item.name} type={item.type}>
                                            {item.label}
                                        </Option>
                                        );
                                    })}
                                </Select>
                                <Select
                                    allowClear
                                    showSearch
                                    style={{ width: 90 }}
                                    placeholder={"equals"}
                                    value={item.operator}
                                    onChange={(value) => {
                                        handleChange(value, 'operator', index)
                                    }}
                                >
                                    { renderOptions(item) }
                                </Select>
                                {
                                    item.operator === 'range' ? (
                                        <>
                                            <InputNumber value={item.values?.[0]} style={{ width: 80 }} onChange={(value) => {
                                                const newValues = item.values ? [...item.values] : []
                                                newValues[0] = value;
                                                handleChange(newValues, 'values', index)
                                            }}/>-<InputNumber value={item.values?.[1]} style={{ width: 80 }} onChange={(value) => {
                                                const newValues = item.values ? [...item.values] : []
                                                newValues[1] = value;
                                                handleChange(newValues, 'values', index)
                                            }}/>
                                        </>
                                    ) : (
                                        <Input value={item.values?.[0]} style={{ width: 100 }} onChange={(e) => {
                                            handleChange([e.target.value], 'values', index)
                                        }}/>
                                    )
                                }
                                <Icon 
                                    style={{ fontSize: 16, cursor: 'pointer', marginLeft: 8 }} 
                                    type="delete" 
                                    onClick={() => handleRemove(index)}
                                />
                                <Dropdown overlay={(
                                    <Menu onClick={({key}) => {
                                        handleAdd(key)
                                    }}>
                                        <Menu.Item key="and">AND</Menu.Item>
                                        <Menu.Item key="or">OR</Menu.Item>
                                    </Menu>
                                )} trigger={['click']}>
                                    <Icon 
                                        style={{ color: '#007fff', fontSize: 16, cursor: 'pointer', marginLeft: 8}} 
                                        type="plus-circle" theme="filled" 
                                    />
                                </Dropdown>
                            </div>
                        </>
                    )
                })
            }
        </>
    )
}


export default (props) => {

    const { form, globalQueries, customQueries, isGlobalDataSource, 
        isGlobalFilters, setIsGlobalFilters,
        isFilterAdvanced, setIsFilterAdvanced 
    } = props;

    const { getFieldDecorator } = form;

    const { kql_filters, dsl, query } = customQueries;

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

    return (
        <>
            <HideWizard visible={isGlobalDataSource}>
                {getFieldDecorator('isGlobalFilters', {
                    initialValue: isGlobalFilters,
                })(
                    <Select onChange={setIsGlobalFilters} style={{ width: '100%' }}>
                        <Select.Option value={true}>
                            Use Dashboard's Setting
                        </Select.Option>
                        <Select.Option value={false}>
                            Custom
                        </Select.Option>
                    </Select>
                )}
            </HideWizard>
            <HideWizard visible={!isGlobalFilters}>
                {
                    isFilterAdvanced ? (
                        getFieldDecorator('dsl', {
                            initialValue: dsl || query,
                        })(
                            <Input.TextArea rows={6} placeholder="Please input dsl"/>
                        )
                    ) : (
                        getFieldDecorator('kql_filters', {
                            initialValue: kql_filters?.length >0 ? kql_filters : [{}],
                        })(
                            <KqlFilters indices={indices} clusterId={cluster_id}/>
                        )
                    )
                }
            </HideWizard>
            {getFieldDecorator('isFilterAdvanced', {
                initialValue: isFilterAdvanced,
            })(
                <a onClick={() => setIsFilterAdvanced(!isFilterAdvanced)}>
                    { isFilterAdvanced ? formatMessage({id: "dashboard.widget.config.source.filters.normal"}) : formatMessage({id: "dashboard.widget.config.source.filters.advanced"})}
                </a>
            )}
        </>
    )
}