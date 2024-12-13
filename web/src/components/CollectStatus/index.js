import request from "@/utils/request"
import { firstUpperCase, formatToUniversalTime } from "@/utils/utils";
import { Descriptions, Icon, Tooltip } from "antd";
import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./index.less";
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

    const fetchData = async (fetchUrl) => {
        if (!fetchUrl) return
        setLoading(true)
        const res = await request(fetchUrl)
        if (res && !res?.error) {
            setData(res)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData(fetchUrl)
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }
        intervalRef.current = setInterval(() => {
            fetchData(fetchUrl)
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
                <Descriptions className={styles.content} title={formatMessage({ id: 'cluster.collect.last_active_at'})} column={1}>
                    {
                        stats.map((key) => (
                            <Descriptions.Item key={key} label={formatMessage({ id: `cluster.manage.monitor_configs.${key}`})}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    {STATUS_ICONS[data?.[key]?.status || 'unknown']}{formatToUniversalTime(data?.[key]?.last_active_at)}
                                </div>
                            </Descriptions.Item>
                        ))
                    }
                </Descriptions>
            )}
            overlayStyle={{ maxWidth: 360 }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {renderIcon()}
                {firstUpperCase(data?.metric_collection_mode) || "Unknown"}
            </div>
        </Tooltip>
    );
}