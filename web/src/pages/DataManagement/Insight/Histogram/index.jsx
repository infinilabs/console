import { DiscoverHistogram } from "@/components/vendor/discover/public/application/components/histogram/histogram";
import { Icon, Popover } from "antd"
import { useEffect, useRef, useState } from "react";
import styles from "./index.less";

export default (props) => {

    const { histogramData, timefilterUpdateHandler } = props

    const [visible, setVisible] = useState(false)

    return (
        <Popover 
            visible={visible} 
            placement="left" 
            title={null} 
            overlayClassName={styles.histogram}
            content={(
                <DiscoverHistogram
                    chartData={histogramData}
                    timefilterUpdateHandler={timefilterUpdateHandler}
                />
        )}>
            <Icon type="bar-chart" style={{color: '#006BB4', cursor: 'pointer'}} onClick={() => {
                setVisible(!visible)
            }}/>
        </Popover>
    )
}