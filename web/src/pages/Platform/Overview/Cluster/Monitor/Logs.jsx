import { Empty, Input, Spin, Table } from "antd";
import { formatMessage } from "umi/locale";
import { Link } from "umi";
import Logs from "../../components/Logs";

const AGGS = {
    "Node":{"terms":{"field":"metadata.labels.node_name", "size": 1000 }},
    "Type":{"terms":{"field":"metadata.name", "size": 1000 }},
    "Level":{"terms":{"field":"payload.level", "size": 1000 }},
}

export default (props) => {
    const { clusterID, param = {} } = props;

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
                    render: (value, record) => {
                        if (!record.metadata?.labels?.node_uuid) return value
                        return (
                            <Link to={`/cluster/monitor/${clusterID}/nodes/${record.metadata.labels.node_uuid}?_g=${encodeURIComponent(JSON.stringify(param))}`}>
                                {value}
                            </Link>
                        )
                    }
                },
            ]}
        />
    );
}