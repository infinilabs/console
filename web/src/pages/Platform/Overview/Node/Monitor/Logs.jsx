import { Empty, Input, Spin, Table } from "antd";
import { formatMessage } from "umi/locale";
import Logs from "../../components/Logs";

const AGGS = {
    "Type":{"terms":{"field":"metadata.name", "size": 1000 }},
    "Level":{"terms":{"field":"payload.level", "size": 1000 }},
}

export default (props) => {
    const { nodeID } = props;

    return (
        <Logs 
            {...props} 
            aggs={AGGS} 
            queryFilters={[
                {
                    "term": {
                        "metadata.labels.node_uuid": nodeID
                    }
                }
            ]}
        />
    );
}