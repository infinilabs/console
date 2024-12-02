import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { Button, Form, Icon, Input, Select, Tabs } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";
import styles from "./DataSourceModal.less"
import { FORM_ITEM_LAYOUT } from "../../../Widget/WidgetConfig";
import Queries from "./Queries";
import TimeField from "./TimeField";
import TimeRange from "./TimeRange";
import Filters from "./Filters";

export default Form.create()((props) => {

    const { 
        visible, setVisible, form, globalQueries, customQueries, clusterList, 
        isGlobalDataSource, setIsGlobalDataSource,
        isGlobalTimeField, setIsGlobalTimeField,
        isGlobalTimeRange, setIsGlobalTimeRange,
        isGlobalFilters, setIsGlobalFilters,
        isFilterAdvanced, setIsFilterAdvanced,
    } = props;

    const { getFieldDecorator } = form;

    const { onChange } = customQueries;

    const [ customQueriesCache, setCustomQQueriesCache ] = useState(customQueries)

    const onSubmit = () => {
        form.validateFields((err, values) => {
            if (err) {
                return false;
            }
            const { 
                isGlobalDataSource, isGlobalTimeField, isGlobalTimeRange, 
                isGlobalFilters, isFilterAdvanced,
                cluster_id, indices, time_field, range, kql_filters = [], dsl 
            } = values;
            onChange({
                cluster_id: isGlobalDataSource ? undefined : cluster_id,
                indices: isGlobalDataSource ? undefined : indices,
                time_field: isGlobalTimeField ? undefined : time_field,
                range: isGlobalTimeRange ? undefined : range,
                kql_filters: isGlobalFilters ? undefined : (
                    isFilterAdvanced ? undefined : kql_filters.filter((item) => {
                        if (!item.field || !item.operator || !item.values) return false;
                        if (item.operator === 'range') {
                            if (item.values.length !== 2) {
                                return false;
                            } else {
                                return true;
                            }
                        }
                        return true;
                    }).map((item, index) => {
                        if (index === 0) delete item.logic;
                        return item
                    })
                ),
                dsl: isGlobalFilters ? undefined : ( isFilterAdvanced ? dsl : undefined )
            })
            setVisible(false)
        })
    }

    useEffect(() => {
        setCustomQQueriesCache(customQueries)
    }, [JSON.stringify(customQueries)])

    if (!visible) return null;

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Icon onClick={() => setVisible(false)} className={styles.close} type="close" />
                <Tabs tabBarStyle={{ marginBottom: 20 }} defaultActiveKey={'data_source'}>
                    <Tabs.TabPane forceRender={true} tab={formatMessage({id: "dashboard.widget.config.data.source"})} key="data_source">
                        <Form {...FORM_ITEM_LAYOUT} colon={false}>
                            <Form.Item label={formatMessage({id: "dashboard.widget.config.data.source"})}>
                                {getFieldDecorator("isGlobalDataSource", {
                                    initialValue: isGlobalDataSource,
                                })(
                                    <Select onChange={(value) => {
                                        setIsGlobalDataSource(value)
                                        if (value) {
                                            form.setFieldsValue({ 
                                                cluster_id: undefined,
                                                indices: [],
                                                time_field: undefined,
                                                kql_filters: undefined,
                                                dsl: undefined
                                            })
                                        }
                                    }} style={{ width: '100%' }}>
                                        <Select.Option value={true}>
                                            Use Dashboard's Setting
                                        </Select.Option>
                                        <Select.Option value={false}>
                                            Custom
                                        </Select.Option>
                                    </Select>
                                )}
                            </Form.Item>
                            <Queries 
                                form={form}
                                initialValues={isGlobalDataSource ? {
                                    cluster_id: { name: 'global_cluster_id', value: globalQueries.cluster_id, disabled: true },
                                    indices: { name: 'global_indices', value: globalQueries.indices, disabled: true },
                                } : {
                                    cluster_id: { 
                                        name: 'cluster_id', 
                                        value: customQueriesCache.cluster_id,
                                        onChange: (value) => {
                                            setCustomQQueriesCache({
                                                ...customQueriesCache,
                                                cluster_id: value,
                                                indices: [],
                                                time_field: undefined,
                                                kql_filters: undefined,
                                                dsl: undefined
                                            })
                                            form.setFieldsValue({ 
                                                indices: [],
                                                time_field: undefined,
                                                kql_filters: undefined,
                                                dsl: undefined
                                            })
                                        }
                                    },
                                    indices: { 
                                        name: 'indices', 
                                        value: customQueriesCache.indices,
                                        onChange: (value) => {
                                            setCustomQQueriesCache({
                                                ...customQueriesCache,
                                                indices: value,
                                                time_field: undefined,
                                                kql_filters: undefined,
                                                dsl: undefined
                                            })
                                            form.setFieldsValue({ 
                                                time_field: undefined,
                                                kql_filters: undefined,
                                                dsl: undefined
                                            })
                                        }
                                    },
                                }}
                                clusterList={clusterList}
                            />
                        </Form>
                    </Tabs.TabPane>
                    <Tabs.TabPane forceRender={true} tab={formatMessage({id: "dashboard.widget.config.data.source.filter"})} key="filter">
                    <Form {...FORM_ITEM_LAYOUT} colon={false}>
                        <Form.Item label={formatMessage({id: "dashboard.widget.config.source.time.field"})}>
                            <TimeField 
                                form={form}
                                globalQueries={globalQueries}
                                customQueries={customQueriesCache}
                                isGlobalDataSource={isGlobalDataSource}
                                isGlobalTimeField={isGlobalTimeField}
                                setIsGlobalTimeField={setIsGlobalTimeField}
                            />
                        </Form.Item>
                        <Form.Item label={formatMessage({id: "dashboard.widget.config.source.time.range"})}>
                            <TimeRange
                                form={form}
                                globalQueries={globalQueries}
                                customQueries={customQueriesCache}
                                isGlobalTimeRange={isGlobalTimeRange}
                                setIsGlobalTimeRange={setIsGlobalTimeRange}
                            />
                        </Form.Item>
                        <Form.Item label={isFilterAdvanced ? formatMessage({id: "dashboard.widget.config.source.query.dsl"}) : formatMessage({id: "dashboard.widget.config.source.query"})}>
                            <Filters 
                                form={form}
                                globalQueries={globalQueries}
                                customQueries={customQueriesCache}
                                isGlobalDataSource={isGlobalDataSource}
                                isGlobalFilters={isGlobalFilters}
                                setIsGlobalFilters={setIsGlobalFilters}
                                isFilterAdvanced={isFilterAdvanced}
                                setIsFilterAdvanced={setIsFilterAdvanced}
                            />
                        </Form.Item>    
                    </Form>
                    </Tabs.TabPane>
                </Tabs>
                <Form {...FORM_ITEM_LAYOUT} colon={false}>
                    <Form.Item label={" "}>
                        <div className={styles.actions}>
                            <Button style={{ marginRight: 12 }} onClick={() => setVisible(false)}>
                                {formatMessage({id: "dashboard.widget.config.cancel"})}
                            </Button>
                            <Button type="primary" onClick={onSubmit}>
                                {formatMessage({id: "dashboard.widget.config.confirm"})}
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
})