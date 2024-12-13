import request from "@/utils/request"
import { firstUpperCase, formatToUniversalTime } from "@/utils/utils";
import { Descriptions, Icon, Spin, Tooltip } from "antd";
import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatMessage } from "umi/locale";

const STATUS_ICONS = {
    'ok': (
        <div
            style={{
                background: "#00bb1b",
                height: 12,
                width: 12,
                borderRadius: 12,
                display: "inline-block",
                verticalAlign: "text-bottom",
            }}
        />
    ),
    'warning': (
        <Icon
            type="warning"
            theme="filled"
            style={{ color: "#ff3030", fontSize: 14 }}
        />
    ),
    'unknown': (
        <div
            style={{
                background: "#bbbbbb",
                height: 12,
                width: 12,
                borderRadius: 12,
                display: "inline-block",
                verticalAlign: "text-bottom",
            }}
        />
    )
}

export default (props) => {

    const { fetchUrl } = props;

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState();
    const intervalRef = useRef()

    const fetchData = async (fetchUrl, showLoading = true) => {
        if (!fetchUrl) return
        if (showLoading) {
            setLoading(true)
        }
        const res = await request(fetchUrl)
        if (res && !res?.error) {
            setData(res)
        }
        if (showLoading) {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData(fetchUrl)
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }
        intervalRef.current = setInterval(() => {
            fetchData(fetchUrl, false)
        }, 300000)
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [fetchUrl])

    const stats = useMemo(() => {
        return ['cluster_health', 'cluster_stats', 'node_stats', data?.metric_collection_mode === 'agent' ? 'shard_stats' : 'index_stats']
    }, [data?.metric_collection_mode])

    const renderIcon = () => {
        if (!data) {
            return STATUS_ICONS['unknown']
        } else if (stats.every((key) => data?.[key]?.status === 'ok')) {
            return STATUS_ICONS['ok']
        } else {
            return STATUS_ICONS['warning']
        }
    }

    return (
        <Tooltip
            placement="bottomRight"
            title={(
                <Spin spinning={loading}>
                    <div>
                        <div style={{ marginBottom: 12 }} >
                            <span style={{ fontWeight: 'bold' }}>
                                {formatMessage({ id: 'cluster.collect.last_active_at'})}
                            </span>
                            <a style={{ marginLeft: 8 }} onClick={() => !loading && fetchData(fetchUrl)} ><Icon type="reload"/></a>
                        </div>
                        {
                            stats.map((key, i) => (
                                <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: i === stats.length - 1 ? 0 : 12 }}>
                                    <div style={{ width: 130 }}>{formatMessage({ id: `cluster.manage.monitor_configs.${key}`})}</div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {STATUS_ICONS[data?.[key]?.status || 'unknown']}{data?.[key]?.last_active_at ? moment.duration(data?.[key]?.last_active_at - new Date().valueOf()).humanize(true) : '-'}
                                    </div>
                                </div>
                            ))
                        } 
                    </div>
                </Spin>
            )}
            overlayStyle={{ maxWidth: 'none', width: 'auto' }}
        >
            <Spin spinning={loading}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: 'pointer' }}>
                    {renderIcon()}
                    {firstUpperCase(data?.metric_collection_mode) || "Unknown"}
                </div>
            </Spin>
        </Tooltip>
    );
}