import styles from './index.less';
import { Button, Col, Divider, Form, Icon, Input, InputNumber, Row, Select, Tabs } from "antd";
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useGlobalContext } from '@/components/vendor/index_pattern_management/public/context';
import Chart from '../WidgetBody/Chart';
import { cloneDeep, isEqual } from 'lodash';
import { formatMessage } from "umi/locale";
import Source from './Source';
import General from './General';
import DataDrilling from './DataDrilling';
import { WIDGETS } from '../widgets';
import GroupDropdown from '../WidgetHeader/GroupDropdown';

export const FORM_ITEM_LAYOUT = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 4 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 18 },
    },
}; 


export default Form.create()((props) => {

    const {
        setBreadcrumbs,
        savedObjects,
        uiSettings,
        indexPatternManagementStart,
        docLinks,
        http,
        getMlCardState,
        data,
      } = useGlobalContext();

    const { globalQueries, record, onRecordChange, clusterList, form, onCancel, onSave, loading, setLoading } = props;

    const { indices: globalIndices, cluster_id: globalClusterId, time_field: globalTimeField, query: globalQuery } = globalQueries;

    const { getFieldDecorator } = form;

    const [activeKey, setActiveKey] = useState('source')

    const { title, series = [], is_layered, layer_index } = record;

    const { metric = {}, type, queries = {} } = series[0] || {}

    const { groups = [], items = [], formula } = metric;

    const [customQueries, setCustomQueries] = useState(queries)

    const [refresh, setRefresh] = useState();

    const handleApply = () => {
        submitRecord((sr) => {
            if (isEqual(sr, record)) {
                setRefresh(new Date().getTime())
            } else {
                onRecordChange(sr)
            }
        })
    }

    const handleSave = () => {
        submitRecord((sr) => {
            onSave(sr)
        })
    }

    const submitRecord = (callback) => {
        form.validateFields((err, values) => {
            if (err) {
                return false;
            }
            const { 
                title, 
                cluster_id,
                indices,
                time_field,
                query,  
                metrics = [],
                groups = [],
                type,
                bucket_size,
                group_mapping,
                format,
                is_stack,
                is_percent,
                order,
                size,
                columns,
                page_size,
                drilling = {},
                url,
                is_layered,
                group_labels
            } = values;

            const widgetPlugin = WIDGETS.find((item) => item.type === type)

            const submitRecord = {
                id: record.id,
                position: record.position,
                title,
                drilling,
                is_layered,
                group_labels
            }
            if (type === 'iframe') {
                submitRecord.url = url;
                submitRecord.series = [{
                    type,
                }]
            } else if (type === 'table') {
                submitRecord.page_size = page_size;
                submitRecord.series = [{
                    columns,
                    queries: customQueries,
                    type,
                }]
            } else {
                submitRecord.format = format
                submitRecord.bucket_size = widgetPlugin.isTimeSeries ? (bucket_size || 'auto') : undefined
                submitRecord.group_mapping = group_mapping
                if (type === 'agg-table') {
                    submitRecord.page_size = page_size;
                }
                if (['bar', 'column', 'date-bar', 'date-histogram'].includes(type)) {
                    submitRecord.is_stack = is_stack
                    submitRecord.is_percent = is_percent
                }
                if (['bar', 'column', 'treemap'].includes(type)) {
                    submitRecord.order = order
                    submitRecord.size = size
                }
                if (['area'].includes(type)) {
                    submitRecord.is_percent = is_percent
                }
                if (['calendar-heatmap'].includes(type)) {
                    submitRecord.bucket_size = '1d'
                }
                if (metrics.length === 0) {
                    submitRecord.series = [{ 
                        type,
                        queries: customQueries
                    }]
                } else {
                    submitRecord.series = metrics.map((metric) => {
                        const { items = [], formula, name, sort = [] } = metric;
                        return {
                            metric: {
                                name,
                                formula,
                                items: items.length > 0 ? items.filter((item) => !!item.field && !!item.statistic) : undefined,
                                groups: groups.length > 0 ? groups.filter((item) => !!item.field) : undefined,
                                sort: sort.length === 0 ? [{ key: '_count', direction: 'desc'}] : sort
                            },
                            queries: customQueries,
                            type,
                        }
                    })
                }
            }
            callback(submitRecord)
        });
    }

    const handleTabChange = (key) => {
        form.validateFields((err, values) => {
            if (err) {
                return false;
            }
            setActiveKey(key)
        });
    }

    const handleLayerChange = (groupIndex) => {
        const newRecord = cloneDeep(record)
        newRecord.layer_index = groupIndex;
        onRecordChange(newRecord)
    }

    const widgetPlugin = useMemo(() => {
        form.setFieldsValue({ type: type })
        return WIDGETS.find((item) => item.type === type)
    }, [type])

    return (
        <div className={styles.widgetConfig}>
            <div className={styles.content}>
                <div className={styles.preview}>
                    <Chart 
                        record={record}
                        globalQueries={globalQueries}
                        refresh={refresh}
                        setLoading={setLoading}
                        isEdit={true}
                    />
                    {
                        is_layered && groups.length > 1 && (
                            <div className={styles.layers}>
                                <GroupDropdown 
                                    visible={is_layered && groups.length > 1} 
                                    currentIndex={layer_index}
                                    handleLayerChange={handleLayerChange}
                                    groups={groups}
                                />
                            </div>
                        )
                    }
                </div>
                <div className={styles.config}>
                    {
                        getFieldDecorator(`type`, {
                            initialValue: type,
                        })(
                            <div/>
                        )
                    }
                    <Tabs activeKey={activeKey} onChange={handleTabChange}>
                        <Tabs.TabPane forceRender={true} tab={formatMessage({id: "dashboard.widget.config.tab.source.title"})} key="source">
                            <Source 
                                form={form}
                                globalQueries={globalQueries}
                                customQueries={{
                                    ...customQueries,
                                    onChange: (values) => setCustomQueries({...customQueries, ...values})
                                }}
                                record={record}
                                clusterList={clusterList}
                                widgetPlugin={widgetPlugin}
                                onRecordChange={onRecordChange}
                            />
                        </Tabs.TabPane>
                        <Tabs.TabPane forceRender={true} tab={formatMessage({id: "dashboard.widget.config.tab.general.title"})} key="general">
                            <General 
                                form={form}
                                record={record}
                                type={type}
                                widgetPlugin={widgetPlugin}
                            />
                        </Tabs.TabPane>
                        <Tabs.TabPane forceRender={true} tab={formatMessage({id: "dashboard.widget.config.tab.data.drilling"})} key="drilling">
                            <DataDrilling 
                                form={form}
                                record={record}
                            />
                        </Tabs.TabPane>
                        
                    </Tabs>
                </div>
            </div>
            <div className={styles.actions}>
                <Button style={{ marginRight: 12 }} onClick={onCancel}>
                {formatMessage({id: "dashboard.widget.config.cancel"})}
                </Button>
                <Button style={{ marginRight: 12 }} onClick={handleApply}>
                {formatMessage({id: "dashboard.widget.config.apply"})}
                </Button>
                <Button type="primary" onClick={handleSave}>
                {formatMessage({id: "dashboard.widget.config.save"})}
                </Button>
            </div>
        </div>
    )
})