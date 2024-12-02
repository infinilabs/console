import { Icon, Spin, Tabs } from "antd";
import styles from "./WidgetConfigForm.less";
import { WIDGETS } from "../widgets";
import { Fragment, useEffect, useMemo, useState } from "react";
import WidgetConfig from ".";
import { cloneDeep } from "lodash";

export default (props) => {

    const { record } = props;

    const [newRecord, setNewRecord] = useState(record);

    const { series = [] } = newRecord;
    const { type } = series[0] || {}

    const [loading, setLoading] = useState(false);

    const onTypeChange = (newType) => {
        const nr = cloneDeep(newRecord)
        const { series = [] } = nr;
        series.forEach((item) => {
            item.type = newType
        })
        const oldWidget = WIDGETS.find((item) => item.type === type);
        const newWidget = WIDGETS.find((item) => item.type === newType);
        if (newWidget.isTimeSeries !== oldWidget.isTimeSeries) {
            if (newWidget.isTimeSeries) {
                nr.bucket_size = 'auto'
            } else {
                nr.bucket_size = undefined
            }
        }
        setNewRecord(nr)
    }

    const renderTab = (item) => {
        return (
            <div 
                className={`${styles.widgetType} ${item.type === type ? styles.selected : ''}`} 
            >
                { item.icon && <Icon className={styles.icon} component={item.icon} /> }
                <div className={styles.name}>{item.displayName}</div>
            </div>
        )
    }

    return (
        <div className={styles.widgetConfigForm}>
            <Spin spinning={loading}>
                <Tabs tabBarStyle={{padding: '0px 30px', marginBottom: 0, border: 0}} defaultActiveKey={type} onChange={onTypeChange}>
                    {
                        WIDGETS.map((item) => (
                            <Tabs.TabPane tab={renderTab(item)} key={item.type} />
                        ))
                    }
                </Tabs>
                <Fragment key={type}>
                    <WidgetConfig 
                        {...props} 
                        record={newRecord}
                        onRecordChange={setNewRecord}
                        loading={loading}
                        setLoading={setLoading}
                    />
                </Fragment>
            </Spin>
        </div>
    )    
}