
import TreemapSvg from "@/components/Icons/Treemap"
import styles from "./index.less"
import { Button, Icon, Input, InputNumber, message, Popover, Radio, Select, Spin, Tooltip } from "antd";
import { formatMessage } from "umi/locale";
import ConvertSvg from "@/components/Icons/Convert"
import { useEffect, useMemo, useRef, useState } from "react";
import ColorPicker from "./ColorPicker";
import Chart from "./Chart";
import Table from "./Table";
import GradientColorPicker from "./GradientColorPicker";
import { cloneDeep } from "lodash";
import request from "@/utils/request";
import { formatTimeRange } from "@/lib/elasticsearch/util";
import { CopyToClipboard } from "react-copy-to-clipboard";

const DEFAULT_TOP = 15;
const DEFAULT_COLORS = ['#00bb1b', '#fcca00', '#ff4d4f']

function generate20BitUUID() {
    let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let uuid = characters[Math.floor(Math.random() * characters.length)];
    const buffer = new Uint8Array(9); 
    crypto.getRandomValues(buffer);
    for (let i = 0; i < buffer.length; i++) {
        uuid += buffer[i].toString(16).padStart(2, '0');
    }
    return uuid.slice(0, 20);
}

export default (props) => {

    const { type, clusterID, timeRange } = props;

    const [currentMode, setCurrentMode] = useState('treemap')

    const [formData, setFormData] = useState({
        top: DEFAULT_TOP,
        colors: DEFAULT_COLORS
    })

    const [config, setConfig] = useState({})

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [result, setResult] = useState()
    const [selectedView, setSelectedView] = useState()
    const searchParamsRef = useRef()

    const fetchFields = async (clusterID, viewID, type) => {
        if (!clusterID || !viewID) return;
        setLoading(true)
        const res = await request(`/elasticsearch/${clusterID}/saved_objects/_bulk_get`, {
            method: 'POST',
            body: [{ 
                id: viewID,
                type: "view"
            }]
        })
        if (res && !res.error && Array.isArray(res.saved_objects) && res.saved_objects[0]) {
            const newView = res.saved_objects[0]
            let { fieldFormatMap, fields } = newView.attributes || {}
            try {
                fieldFormatMap = JSON.parse(fieldFormatMap) || {}
                fields = JSON.parse(fields) || []
            } catch (error) {
                fieldFormatMap = {}
                fields = []
            }
            if (!newView.attributes) newView.attributes = {}
            newView.fieldFormatMap = fieldFormatMap
            newView.fields = fields.filter((item) => 
                !!item.metric_config && 
                !!item.metric_config.name && 
                !!item.metric_config.option_aggs && 
                item.metric_config.option_aggs.length > 0 && 
                item.metric_config.tags?.includes(type === 'index' ? 'indices' : type)
            ).map((item) => ({
                ...item,
                format: fieldFormatMap[item.name]?.id
            }))
            setSelectedView(newView)
            if (newView.fields.length > 0 && (!formData.sourceArea && !formData.sourceColor)) {
                const initField = newView.fields[0]
                const initStatistic = newView.fields[0].metric_config?.option_aggs?.[0]
                const newFormData = {
                    ...cloneDeep(formData),
                    sourceArea: initField,
                    statisticArea: initStatistic,
                    sourceColor: initField,
                    statisticColor: initStatistic
                }
                setFormData(newFormData)
                fetchData(type, clusterID, timeRange, newFormData)
            }
        } else {
            setFormData({
                top: DEFAULT_TOP,
                colors: DEFAULT_COLORS
            })
        }
        setLoading(false)
    }

    const fetchData = async (type, clusterID, timeRange, formData, shouldLoading = true) => {
        if (!clusterID || !timeRange || (!formData.sourceArea && !formData.sourceColor)) return;
        if (shouldLoading) {
            setLoading(true)
        }
        const { top, sourceArea = {}, statisticArea, statisticColor, sourceColor = {} } = formData
        const newTimeRange = formatTimeRange(timeRange);
        searchParamsRef.current = { type, clusterID, formData }
        let areaValueID
        let colorValueID
        const items = []
        const formulas = []
        if (sourceArea?.name && statisticArea) {
            areaValueID = generate20BitUUID()
            items.push({
                name: areaValueID,
                field: sourceArea.name,
                statistic: statisticArea,
            })
            formulas.push(areaValueID)
        }
        if (sourceColor) {
            colorValueID = generate20BitUUID()
            items.push({
                name: colorValueID,
                field: sourceColor.name,
                statistic: statisticColor,
            })
            formulas.push(colorValueID)
        }
        const sortKey = areaValueID || colorValueID
        const body = {
            "index_pattern": ".infini_metrics*",
            "time_field": "timestamp",
            "bucket_size": "auto",
            "filter": {
                "bool": {
                    "must": [{
                        "term": {
                            "metadata.name": {
                                "value": `${type}_stats`
                            }
                        }
                    }, {
                        "term": {
                            "metadata.category": {
                                "value": "elasticsearch"
                            }
                        }
                    }, {
                        "range": {
                            "timestamp": {
                                "gte": newTimeRange.min,
                                "lte": newTimeRange.max,
                            }
                        }
                    }],
                    "must_not": type === 'index' ? [{
                        "term": {
                            "metadata.labels.index_name": {
                                "value": `_all`
                            }
                        }
                    }] : [],
                    "filter": [
                        {
                            "term": { "metadata.labels.cluster_id": clusterID }
                        }
                    ],
                }
            },
            "formulas": formulas,
            "items": items,
            "groups": [{
                "field": type === 'shard' ? `metadata.labels.shard_id` : `metadata.labels.${type}_name`,
                "limit": top
            }],
            "sort": sortKey ? [{
                "direction": "desc",
                "key": sortKey
            }] : undefined
        }
        if (statisticArea !== 'rate' && statisticColor !== 'rate') {
            delete body['time_field']
            delete body['bucket_size']
        }
        const res = await request(`/elasticsearch/infini_default_system_cluster/visualization/data`, {
            method: 'POST',
            body 
        })
        if (res && !res.error) {
            setResult(res)
            const newConfig = cloneDeep(formData)
            if (newConfig.sourceArea?.name && newConfig.sourceArea?.metric_config?.name) {
                newConfig.sourceArea = {
                    key: newConfig.sourceArea?.name,
                    name: newConfig.sourceArea.metric_config.name,
                    formula: areaValueID,
                    format: newConfig.sourceColor.format,
                    unit: newConfig.sourceArea.metric_config.unit
                }
            }
            if (newConfig.sourceColor?.name && newConfig.sourceColor?.metric_config?.name) {
                newConfig.sourceColor = {
                    key: newConfig.sourceColor?.name,
                    name: newConfig.sourceColor.metric_config.name,
                    formula: colorValueID,
                    format: newConfig.sourceColor.format,
                    unit: newConfig.sourceColor.metric_config.unit
                }
            }
            setConfig(newConfig)
        } else {
            setResult()
        }
        if (shouldLoading) {
            setLoading(false)
        }
    }

    const onFormDataChange = (values) => {
        setFormData({
            ...cloneDeep(formData),
            ...values
        })
    }

    const onMetricExchange = () => {
        const newFormData = cloneDeep(formData);
        const sourceTmp = cloneDeep(newFormData.sourceArea)
        const statisticTmp = newFormData.statisticArea
        newFormData.sourceArea = cloneDeep(newFormData.sourceColor)
        newFormData.statisticArea = newFormData.statisticColor
        newFormData.sourceColor = sourceTmp
        newFormData.statisticColor = statisticTmp
        setResult()
        setFormData(newFormData)
        fetchData(type, clusterID, timeRange, newFormData)
    }

    useEffect(() => {
        fetchFields(clusterID, 'infini_metrics', type)
    }, [clusterID, type])

    useEffect(() => {
    }, [type])

    const isTreemap = useMemo(() => {
        return currentMode === 'treemap'
    }, [currentMode])

    const { sourceArea, sourceColor } = config

    const formatData = useMemo(() => {

        const { data = [] } = result || {};
        if (!data || data.length === 0) return []
        let sortKey;
        const newData = data.filter((item) => !!(item.groups && item.groups[0])).map((item) => {
            const { groups = [], value } = item;
            let name = groups[0];
            if (type === 'shard') {
                const splits = name.split(':')
                if (splits.length > 1) {
                    name = splits.slice(1).join(':')
                }
            }
            const object = {
                name: name,
                displayName: name,
            }

            if (sourceArea) {
                object['metricArea'] = sourceArea.key
                object['value'] = value?.[sourceArea?.formula] || 0
                object['nameArea'] = sourceArea.name
                sortKey = 'value'
            } else {
                if (sourceColor) {
                    const key = generate20BitUUID();
                    object['metricArea'] = `metric_${key}`
                    object['value'] = 1
                    object['nameArea'] = `name_${key}`
                    object['tooltipArea'] = false
                }
            }

            if (sourceColor) {
                object['metricColor'] = sourceColor.key
                object['valueColor'] = value?.[sourceColor.formula] || 0
                object['nameColor'] = sourceColor.name
                sortKey = 'valueColor'
            }
            return object
        })
        return sortKey ? newData.sort((a, b) => b[sortKey] - a[sortKey]) : newData
    }, [result, sourceArea, sourceColor, type])

    useEffect(() => {
        if (searchParamsRef.current) {
            const { type, clusterID, formData } = searchParamsRef.current
            fetchData(type, clusterID, timeRange, formData, false)
        }
    }, [timeRange])

    return (
        <Spin spinning={loading}>
        <div className={styles.topn}>
            <div className={styles.header}>
                <Input.Group compact style={{ width: 'auto '}}>
                    <Radio.Group
                        value={currentMode}
                        onChange={(e) => setCurrentMode(e.target.value)}
                        className={styles.mode}
                        style={{ marginRight: 12, marginBottom: 12 }}
                    >
                        <Radio.Button value="treemap">
                            <Icon
                                component={TreemapSvg}
                                style={{
                                    fontSize: 16,
                                    color: isTreemap ? "#1890ff" : "",
                                    verticalAlign: '-3px'
                                }}
                            />
                        </Radio.Button>
                        <Radio.Button value="table">
                            <Icon
                                type="table"
                                style={{
                                    color: !isTreemap ? "#1890ff" : "",
                                }}
                            />
                        </Radio.Button>
                    </Radio.Group>
                    <div className={styles.label}>
                        Top
                    </div>
                    <InputNumber
                        style={{ width: "80px", marginBottom: 12, marginRight: 12 }}
                        className={styles.borderRadiusRight}
                        value={formData.top}
                        min={1}
                        step={1}
                        precision={0}
                        onChange={(value) => onFormDataChange({ top: value })}
                    />
                    <div className={styles.label}>
                        {formatMessage({ id: "cluster.monitor.topn.area" })}
                    </div>
                    <Select 
                        style={{ width: "150px", marginBottom: 12 }}
                        value={formData.sourceArea?.name}
                        dropdownMatchSelectWidth={false}
                        onChange={(value, option) => {
                            if (value) {
                                const { items = [] } = option?.props?.metric || {}
                                onFormDataChange({ 
                                    statisticArea: items[0]?.statistic === 'derivative' ? 'rate' : items[0]?.statistic,
                                    sourceArea: option?.props?.metric
                                })
                            } else {
                                onFormDataChange({ 
                                    statisticArea: undefined, 
                                    sourceArea: undefined 
                                })
                            }
                        }}
                        allowClear
                    >
                        {
                            (selectedView?.fields || []).filter((item) => !!item.metric_config).map((item) => (
                                <Select.Option key={item.name} metric={item}>
                                    {item.metric_config.name}
                                </Select.Option>
                            ))
                        }
                    </Select>
                    <Select 
                        style={{ width: "88px", marginBottom: 12, marginRight: 6 }}
                        className={styles.borderRadiusRight}
                        value={formData.statisticArea}
                        dropdownMatchSelectWidth={false}
                        onChange={(value) => onFormDataChange({ statisticArea: value })}
                    >
                        {
                            formData.sourceArea?.metric_config?.option_aggs?.filter((item) => !!item).map((item) => (
                                <Select.Option key={item}>
                                    {item.toUpperCase()}
                                </Select.Option>
                            ))
                        }
                    </Select>
                    <Button style={{ width: 32, marginBottom: 12, padding: 0, marginRight: 6, borderRadius: 4 }} onClick={() => onMetricExchange()}><Icon style={{ fontSize: 16 }} component={ConvertSvg}/></Button>
                    <div className={styles.label}>
                        {formatMessage({ id: "cluster.monitor.topn.color" })}
                    </div>
                    <Select 
                        style={{ width: "150px", marginBottom: 12 }}
                        value={formData.sourceColor?.name}
                        dropdownMatchSelectWidth={false}
                        onChange={(value, option) => {
                            if (value) {
                                const { items = [] } = option?.props?.metric || {}
                                onFormDataChange({ 
                                    statisticColor: items[0]?.statistic === 'derivative' ? 'rate' : items[0]?.statistic,
                                    sourceColor: option?.props?.metric
                                })
                            } else {
                                onFormDataChange({ 
                                    statisticColor: undefined, 
                                    sourceColor: undefined 
                                })
                            }
                            
                        }}
                        allowClear
                    >
                        {
                            (selectedView?.fields || []).filter((item) => !!item.metric_config).map((item) => (
                                <Select.Option key={item.name} metric={item}>
                                    {item.metric_config.name}
                                </Select.Option>
                            ))
                        }
                    </Select>
                    <Select 
                        style={{ width: "88px", marginBottom: 12 }}
                        value={formData.statisticColor}
                        dropdownMatchSelectWidth={false}
                        onChange={(value) => onFormDataChange({ statisticColor: value })}
                    >
                        {
                            formData.sourceColor?.metric_config?.option_aggs?.filter((item) => !!item).map((item) => (
                                <Select.Option key={item}>
                                    {item.toUpperCase()}
                                </Select.Option>
                            ))
                        }
                    </Select>
                    <div className={styles.label}>
                        {formatMessage({ id: "cluster.monitor.topn.theme" })}
                    </div>
                    <GradientColorPicker className={styles.borderRadiusRight} style={{ marginRight: 12, marginBottom: 12 }} value={formData.colors || []} onChange={(value) => {
                        onFormDataChange({ colors: value })
                        setConfig({
                            ...cloneDeep(config),
                            colors: value
                        })
                    }}/>
                    <Button style={{ marginBottom: 12 }} className={styles.borderRadiusLeft} type="primary" onClick={() => fetchData(type, clusterID, timeRange, formData)}>{formatMessage({ id: "form.button.search" })}</Button>
                </Input.Group>
            </div>
            
            <div className={styles.content}>
                {
                    result?.request && (
                        <CopyToClipboard text={`GET .infini_metrics/_search\n${result.request}`}>
                            <Tooltip title={formatMessage({id: "cluster.metrics.request.copy"})}>
                                <div className={styles.info} onClick={() => message.success(formatMessage({id: "cluster.metrics.request.copy.success"}))}>
                                    <Icon type="copy" />
                                </div>
                            </Tooltip>
                        </CopyToClipboard>
                    )
                }
                { isTreemap ? <Chart config={config} data={formatData} /> : <Table type={type} config={config} data={formatData}/> }
            </div>
        </div>  
        </Spin>
    )
}