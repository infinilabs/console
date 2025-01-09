
import TreemapSvg from "@/components/Icons/Treemap"
import styles from "./index.less"
import { Button, Icon, Input, InputNumber, Popover, Radio, Select, Spin } from "antd";
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
import { autoFormatUnitForBytes, formatNumberData, formatPercentData } from "./utils";
import { CopyToClipboard } from "react-copy-to-clipboard";

const formatters = {
  'number': formatNumberData,
  'bytes': autoFormatUnitForBytes,
  'percent': formatPercentData
}

export default (props) => {

    const { type, clusterID, timeRange } = props;

    const [currentMode, setCurrentMode] = useState('treemap')

    const [metrics, setMetrics] = useState([])

    const [formData, setFormData] = useState({
        top: 15,
        // statisticArea: 'rate',
        // statisticColor: 'max',
        colors: ['#00bb1b', '#fcca00', '#ff4d4f']
    })

    const [config, setConfig] = useState({})

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [result, setResult] = useState()

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

    const fetchData = async (type, clusterID, timeRange, formData) => {
        if (!clusterID || !timeRange || !formData.sourceArea) return;
        setLoading(true)
        const { top, sourceArea = {}, statisticArea, statisticColor, sourceColor = {} } = formData
        const newTimeRange = formatTimeRange(timeRange);
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
            "sort": [{
                "direction": "desc",
                "key": sourceArea?.items[0].name
            }]
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
        setLoading(false)
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

    const { sourceArea, sourceColor } = formData

    const formatData = useMemo(() => {
        const { data = [] } = result || {};
        if (!data || !sourceArea) return { data: [] }
        let formatData = {
            data: data.map((item) => {
                const { groups = [], value } = item;
                const object = {
                    name: groups[0],
                    displayName: groups[0],
                    value: value?.[sourceArea.formula] || 0,
                    metricArea: sourceArea.key,
                    nameArea: sourceArea.name,
                }
                if (sourceColor?.formula && Number.isFinite(value?.[sourceColor?.formula])) {
                    object['metricColor'] = sourceColor.key
                    object['valueColor'] = value?.[sourceColor.formula] || 0
                    object['nameColor'] = sourceColor.name
                }
                return object
            })
        };
        const { format: formatArea } = sourceArea || {}
        const formatterArea = formatters[formatArea]
        if (formatterArea) {
            formatData = formatterArea(formatData.data, 'value')
            formatData = {
                ...formatData,
                unitArea: formatData.unit
            }
        }
        const { format: formatColor } = sourceColor || {}
        const formatterColor = formatters[formatColor]
        if (formatterColor) {
            formatData = formatterColor(formatData.data, 'valueColor')
            formatData = {
                ...formatData,
                unitColor: formatData.unit
            }
        }
        return formatData
    }, [result, sourceArea, sourceColor])

    return (
        <Spin spinning={loading}>
        <div className={styles.topn}>
            <div className={styles.header}>
                <Radio.Group
                    value={currentMode}
                    onChange={(e) => setCurrentMode(e.target.value)}
                    className={styles.mode}
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
                <Input.Group compact style={{ width: 'auto '}}>
                    <Input
                        style={{ width: "60px" }}
                        disabled
                        defaultValue={"Top"}
                    />
                    <InputNumber
                        style={{ width: "80px" }}
                        value={formData.top}
                        min={1}
                        step={1}
                        precision={0}
                        onChange={(value) => onFormDataChange({ top: value })}
                    />
                </Input.Group>
                <Input.Group compact style={{ width: 'auto '}}>
                    <Input
                        style={{ width: "80px" }}
                        disabled
                        defaultValue={"面积指标"}
                    />
                    <Select 
                        style={{ width: "150px" }}
                        value={formData.sourceArea?.key}
                        onChange={(value, option) => {
                            const { items = [] } = option?.props?.metric || {}
                            onFormDataChange({ 
                                statisticArea: items[0]?.statistic === 'derivative' ? 'rate' : items[0]?.statistic,
                                sourceArea: option?.props?.metric
                            })
                        }}
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
                        style={{ width: "88px" }}
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
                </Input.Group>
                <Button style={{ width: 32, padding: 0 }} onClick={() => onMetricExchange()}><Icon style={{ fontSize: 16 }} component={ConvertSvg}/></Button>
                <Input.Group compact style={{ width: 'auto '}}>
                    <Input
                        style={{ width: "80px" }}
                        disabled
                        defaultValue={"颜色指标"}
                    />
                    
                    <Select 
                        style={{ width: "150px" }}
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
                        style={{ width: "88px" }}
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
                    <Input.Group compact style={{ width: 'auto '}}>
                        <Input
                            style={{ width: "60px" }}
                            disabled
                            defaultValue={"主题"}
                        />
                        <GradientColorPicker value={formData.colors || []} onChange={(value) => {
                            onFormDataChange({ colors: value })
                            setConfig({
                                ...cloneDeep(config),
                                colors: value
                            })
                        }}/>
                    </Input.Group>
                </Input.Group>
                <Button type="primary" onClick={() => fetchData(type, clusterID, timeRange, formData)}>{formatMessage({ id: "form.button.search" })}</Button>
                { result?.request && (
                    <CopyToClipboard text={`GET .infini_metrics/_search\n${result.request}`}>
                        <Button >{formatMessage({ id: "cluster.metrics.request.copy" })}</Button>
                    </CopyToClipboard>
                )}
            </div>
            
            <div style={{ height: 'calc(100vh - 500px)', minHeight: 500 }}>
                { isTreemap ? <Treemap config={config} {...formatData}/> : <Table type={type} config={config} {...formatData}/> }
            </div>
        </div>  
        </Spin>
    )
}