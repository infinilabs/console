import { DiscoverHistogram } from "@/components/vendor/discover/public/application/components/histogram/histogram";
import { Icon, Popover } from "antd"
import { useEffect, useRef, useState } from "react";
import styles from "./index.less";

export default (props) => {

    const { onHistogramToggle } = props

    return (
        <Icon type="bar-chart" title="show histogram" style={{color: '#006BB4', cursor: 'pointer'}} onClick={() => {
            onHistogramToggle()
        }}/>
    )
}