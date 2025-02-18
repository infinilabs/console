import { Empty, Input, Spin, Table } from "antd";
import styles from "./Logs.less"
import { formatMessage } from "umi/locale";
import { Link } from "umi";
import Logs from "../../components/Logs";

const AGGS = {
    "Node":{"terms":{"field":"metadata.labels.node_name", "size": 1000 }},
    "Type":{"terms":{"field":"metadata.name", "size": 1000 }},
    "Level":{"terms":{"field":"payload.level", "size": 1000 }},
}

export default (props) => {
    const { clusterID } = props;

    return (
        <Logs 
            {...props} 
            aggs={AGGS} 
            queryFilters={[
                {
                    "term": {
                        "metadata.labels.cluster_id": clusterID
                    }
                }
            ]}
            extraColumns={[
                {
                    title: formatMessage({ id: "cluster.monitor.logs.node" }),
                    key: "metadata.labels.node_name",
                    dataIndex: "metadata.labels.node_name",
                    width: 88,
                    ellipsis: true,
                },
            ]}
        />
    );
}