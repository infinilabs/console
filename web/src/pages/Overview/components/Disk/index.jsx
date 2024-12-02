import styles from "./index.less"
import request from "@/utils/request";
import { pathPrefix } from "@/services/common";
import React , { useEffect, useState } from "react";
import { Spin } from "antd"
import { formatter } from "@/lib/format";

export default () => {

    const [data, setData] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true)
        const res = await request(`${pathPrefix}/elasticsearch/overview`, {
          method: "GET",
        });
        setData(res?.total_used_store_in_bytes || 0);
        setLoading(false)
    };

    useEffect(() => {
        fetchData()
    }, [])

    const totalStoreSize = formatter.bytes(data);

    return (
        loading ? <Spin spinning={true}/> : (
            <div className={styles.num}>
                {totalStoreSize.size}{totalStoreSize.unit}
            </div>
        )
    )
}