
import TreemapSvg from "@/components/Icons/Treemap"
import styles from "./index.less"
import { Button, Icon, Input, InputNumber, message, Popover, Radio, Select, Spin, Tooltip } from "antd";
import { formatMessage } from "umi/locale";
import ConvertSvg from "@/components/Icons/Convert"
import { useEffect, useMemo, useRef, useState } from "react";
import ColorPicker from "./ColorPicker";
import Treemap from "./Treemap";
import Table from "./Table";
import GradientColorPicker from "./GradientColorPicker";
import { cloneDeep } from "lodash";
import request from "@/utils/request";
import { formatTimeRange } from "@/lib/elasticsearch/util";
import { CopyToClipboard } from "react-copy-to-clipboard";
import * as uuid from 'uuid';

export default (props) => {

    const { type, clusterID, timeRange } = props;

    const [currentMode, setCurrentMode] = useState('treemap')

    const [metrics, setMetrics] = useState([])

    const [formData, setFormData] = useState({
        top: 15,
        colors: ['#00bb1b', '#fcca00', '#ff4d4f']
    })

    const [config, setConfig] = useState({})

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [result, setResult] = useState()
    const searchParamsRef = useRef()

    const fetchMetrics = async (type) => {
        setLoading(true)
        const res = await request(`/collection/metric/_search`, {
            method: 'POST',
            body: { 
                size: 10000, 
                from: 0,
                query: { bool: { filter: [{ "term": { "level": type === 'index' ? 'indices' : type } }] }} 
            }
        })
        if (res?.hits?.hits) {
            const newMetrics = res?.hits?.hits.filter((item) => {
                const { items = [] } = item._source;
                if (items.length === 0) return false
                return true;
            }).map((item) => ({ ...item._source }))
            setMetrics(newMetrics)
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
        const sortKey = sourceArea?.items?.[0]?.name || sourceColor?.items?.[0]?.name
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
            "formulas": [sourceArea?.formula, sourceColor?.formula].filter((item) => !!item),
            "items": [...(sourceArea?.items || [])?.map((item) => {
                item.statistic = statisticArea
                if (item.statistic === 'rate') {
                    item.statistic = 'derivative'
                }
                return item
            }),...(sourceColor?.items || [])?.map((item) => {
                item.statistic = statisticColor
                if (item.statistic === 'rate') {
                    item.statistic = 'derivative'
                }
                return item
            })].filter((item) => !!item),
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
            setConfig(cloneDeep(formData))
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
        fetchMetrics(type)
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
                    const key = uuid.v4();
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
                    <Input
                        style={{ width: "60px", marginBottom: 12 }}
                        className={styles.borderRadiusLeft}
                        disabled
                        defaultValue={"Top"}
                    />
                    <InputNumber
                        style={{ width: "80px", marginBottom: 12, marginRight: 12 }}
                        className={styles.borderRadiusRight}
                        value={formData.top}
                        min={1}
                        step={1}
                        precision={0}
                        onChange={(value) => onFormDataChange({ top: value })}
                    />
                    <Input
                        style={{ width: "80px", marginBottom: 12 }}
                        className={styles.borderRadiusLeft}
                        disabled
                        defaultValue={"面积指标"}
                    />
                    <Select 
                        style={{ width: "150px", marginBottom: 12 }}
                        value={formData.sourceArea?.key}
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
                            metrics.map((item) => (
                                <Select.Option key={item.key} metric={item}>
                                    {item.name}
                                </Select.Option>
                            ))
                        }
                    </Select>
                    <Select 
                        style={{ width: "88px", marginBottom: 12, marginRight: 6 }}
                        className={styles.borderRadiusRight}
                        value={formData.statisticArea}
                        onChange={(value) => onFormDataChange({ statisticArea: value })}
                    >
                        {
                            formData.sourceArea?.statistics?.filter((item) => !!item).map((item) => (
                                <Select.Option key={item}>
                                    {item.toUpperCase()}
                                </Select.Option>
                            ))
                        }
                    </Select>
                    <Button style={{ width: 32, marginBottom: 12, padding: 0, marginRight: 6, borderRadius: 4 }} onClick={() => onMetricExchange()}><Icon style={{ fontSize: 16 }} component={ConvertSvg}/></Button>
                    <Input
                        style={{ width: "80px", marginBottom: 12 }}
                        className={styles.borderRadiusLeft}
                        disabled
                        defaultValue={"颜色指标"}
                    />
                    
                    <Select 
                        style={{ width: "150px", marginBottom: 12 }}
                        value={formData.sourceColor?.key}
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
                            metrics.map((item) => (
                                <Select.Option key={item.key} metric={item}>
                                    {item.name}
                                </Select.Option>
                            ))
                        }
                    </Select>
                    <Select 
                        style={{ width: "88px", marginBottom: 12 }}
                        value={formData.statisticColor}
                        onChange={(value) => onFormDataChange({ statisticColor: value })}
                    >
                        {
                            formData.sourceColor?.statistics?.filter((item) => !!item).map((item) => (
                                <Select.Option key={item}>
                                    {item.toUpperCase()}
                                </Select.Option>
                            ))
                        }
                    </Select>
                    <Input
                        style={{ width: "60px", marginBottom: 12 }}
                        disabled
                        defaultValue={"主题"}
                    />
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
                { isTreemap ? <Treemap config={config} data={formatData} /> : <Table type={type} config={config} data={formatData}/> }
            </div>
        </div>  
        </Spin>
    )
}