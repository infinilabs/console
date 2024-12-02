import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import styles from "./EditLayout.less";
import { Button, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import { withRouter } from "react-router-dom";
import { useGlobalContext } from "@/components/vendor/index_pattern_management/public/context";
import { getContext } from "../context";
import Link from "umi/link";
import LayoutGrid from "./LayoutGrid";
import { router } from "umi";
import request from "@/utils/request";

const {
    filterManager,
    queryStringManager,
    timefilter,
    storage,
    getEsQuery,
    getSearchParams,
    intervalOptions,
    getTimeBuckets,
    fetchESRequest,
    services,
} = getContext();

export default withRouter((props) => {

    const { match, selectedCluster, clusterList, clusterStatus } = props;

    const { params } = match;

    const { id: viewId, layoutId } = params;

    const { id: clusterId } = selectedCluster;

    const layoutRef = useRef(null);

    const { data } = useGlobalContext();

    const [loading, setLoading] = useState(false);

    const [record, setRecord] = useState();

    const [indexPattern, setIndexPattern] = useState();

    const fetchData = async (id) => {
        setLoading(true);
        const res = await request(`/layout/${id}`);
        if (res?._source) {
            const { widgets = [] } = res._source.config
            setRecord(res._source)
        }
        setLoading(false);
    }

    const fetchIndexPattern = async () => {
        setLoading(true)
        const ip = await data.indexPatterns.get(viewId, "view");
        if (!ip.id) {
            ip.id = viewId;
        }
        setIndexPattern(ip);
        setLoading(false)
    }

    useEffect(() => {
        if (viewId) {
            fetchIndexPattern()
        }
    }, [data.indexPatterns, viewId]); 

    useEffect(() => {
        if (layoutId) {
            fetchData(layoutId)
        }
    }, [layoutId]); 

    return (
        <PageHeaderWrapper>
            <Spin spinning={loading}>
                <div className={styles.layout}>
                    <div className={styles.header}>
                        <div className={styles.title}>
                            {layoutId ? record?.name : 'Create Layout' }
                        </div>
                        {/* <div className={styles.actions}>
                            <Button type="primary" size="small" onClick={() => layoutRef.current?.onLayoutSave()}>Save</Button>
                            <Link to={`patterns/${indexPattern?.id}?_a=(tab:layout)`}>
                                <Button size="small">Back</Button>
                            </Link>
                        </div> */}
                    </div>
                    <LayoutGrid 
                        ref={layoutRef}
                        isEdit={true}
                        layout={record}
                        type={"view"}
                        globalQueries={{
                            cluster_id: clusterId, 
                            indices: indexPattern?.title ? [indexPattern?.title] : '',
                            time_field: indexPattern?.timeFieldName,
                            range: {
                                from: 'now-15m',
                                to: 'now',
                            },
                            view_id: viewId
                        }}
                        clusterList={clusterList}
                        clusterStatus={clusterStatus}
                        onRecordUpdate={setRecord}
                        onSaveSuccess={() => {
                            router.push(`/data/views/patterns/${indexPattern?.id}?_a=(tab:layout)`)
                        }}
                        onCancel={() => router.push(`/data/views/patterns/${indexPattern?.id}?_a=(tab:layout)`)}
                    />
                </div>
            </Spin>
        </PageHeaderWrapper>
    )
})