import styles from "./index.less"
import React from "react";
import { Spin } from "antd"
import { formatter } from "@/lib/format";

export default ({ data = 0, loading = false }) => {
    const totalStoreSize = formatter.bytes(data);

    return (
        loading ? <Spin spinning={true}/> : (
            <div className={styles.num}>
                {totalStoreSize.size}{totalStoreSize.unit}
            </div>
        )
    )
}