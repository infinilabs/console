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
            style={{ color: "blue", fontSize: 14 }}
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
        const res = await request(fetchUrl, {method: 'POST'}, false, false);
        if (res && !res?.error) {
          const body = res?.response_body || '';
          let retObj = {};
          try{
            retObj = JSON.parse(body)
          }catch(e){
            console.error('Failed to parse response body', e);
          }
          setData(retObj)
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

    const stats = ['rollup_cluster_stats', 'rollup_cluster_health', 'rollup_node_stats', 'rollup_index_stats', 'rollup_index_health', 
      'rollup_shard_stats_metrics', 'rollup_shard_stats_state' ]
   
    const calculateStatus = (nextWindowStartTime) => {
        if (!nextWindowStartTime) {
            return 'unknown';
        }
        const now = new Date().valueOf();
        if(now - nextWindowStartTime <= 2 * 60 * 60 * 1000) { // less than 2 hours
          return 'ok';
        }
        return 'warning';
    }
    const renderIcon = () => {
        if (!data) {
            return STATUS_ICONS['unknown']
        } else if (stats.every((key) => calculateStatus(data?.[key]?.rollup_metadata?.continuous?.next_window_start_time) === 'ok')) {
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
                                Rollup Gap
                            </span>
                            <a style={{ marginLeft: 8 }} onClick={() => !loading && fetchData(fetchUrl)} ><Icon type="reload"/></a>
                        </div>
                        {
                            stats.map((key, i) => {
                              const nextWindowStartTime = data?.[key]?.rollup_metadata?.continuous?.next_window_start_time;
                              return (
                                <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: i === stats.length - 1 ? 0 : 12 }}>
                                    <div style={{ width: 140 }}>{formatMessage({ id: `cluster.manage.monitor_configs.${key}`})}</div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {STATUS_ICONS[calculateStatus(nextWindowStartTime)]}{ nextWindowStartTime? moment.duration(nextWindowStartTime - new Date().valueOf()).humanize(true) : '-'}
                                    </div>
                                </div>
                            )})
                        } 
                    </div>
                </Spin>
            )}
            overlayStyle={{ maxWidth: 'none', width: 'auto' }}
        >
            <Spin spinning={loading}>
                <div style={{ ...(props.style || {}), display: "flex", alignItems: "center", gap: 6, cursor: 'pointer' }}>
                    {renderIcon()} Rollup
                </div>
            </Spin>
        </Tooltip>
    );
}