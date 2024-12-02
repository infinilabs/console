import ZoomIn from "@/components/Icons/ZoomIn";
import ZoomOut from "@/components/Icons/ZoomOut";
import { Icon } from "antd";
import { useMemo } from "react";
import styles from "./index.less";

export default (props) => {

    const { record, actions = {}, onRecordChange, onRecordReset } = props;

    const { zoom, handleZoom } = actions;

    const { id, bucket_size, series = [] } = record

    const { metric = {}, type, queries = {} } = series[0] || {}

    const isTimeSeries = useMemo(() => {
        return !!bucket_size && ['area', 'line', 'column', 'bar'].includes(type)
    }, [bucket_size, type])

    if (!isTimeSeries) return null;

    return (
        <>
            <Icon title="zoom-out" className={zoom > 0 ? '' : styles.disabled} component={ZoomOut} onClick={() => zoom > 0 && handleZoom(zoom - 1)}/>
            <Icon title="zoom-in" component={ZoomIn} onClick={() => handleZoom(zoom + 1)}/>
        </>
    )
}