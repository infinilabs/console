import styles from './index.less';
import Chart from './Chart';
import { useEffect, useMemo, useState } from 'react';
import { Icon, Popover } from 'antd';
import QuickBar from '../../components/QuickBar';
import { WIDGETS } from '../widgets';

export default (props) => {

    const { record, isEdit, onRecordChange, onRecordReset, isFullScreen } = props;

    const { series = [] } = record;
    const { metric = {}, type } = series[0] || {}

    const { items = [], formula } = metric;

    const [quickBarVisible, setQuickBarVisible] = useState(false)

    const onQuickChange = (series) => {
        const newRecord = { ...record, series: [] };
        newRecord.series[0] = series
        onRecordChange(newRecord)
    }

    const hasQuickBar = useMemo(() => {
        const widget = WIDGETS.find((item) => item.type === type);
        if (!widget) return false;
        return !isFullScreen && series.length === 1 && items.length === 1 && !isEdit && !!widget.quickBar
    }, [isFullScreen, series.length, items.length, isEdit, type])

    useEffect(() => {
        if (isEdit) {
            setQuickBarVisible(false)
        }
    }, [isEdit])

    const style = {}

    if (quickBarVisible) {
        style.display = 'block'
    }

    return (
        <div className={styles.body}>
            {
                hasQuickBar && (
                    <div className={styles.quickBar} style={style}>
                        <QuickBar 
                            {...props} 
                            visible={quickBarVisible} 
                            onVisibleChange={setQuickBarVisible} 
                            onReset={onRecordReset} 
                            onChange={onQuickChange}
                        />
                    </div>
                )
            }
            <div className={styles.chart} style={{ paddingTop: quickBarVisible ? 40 : 0}}>
                <Chart {...props}/>
            </div>
        </div>
    )
}