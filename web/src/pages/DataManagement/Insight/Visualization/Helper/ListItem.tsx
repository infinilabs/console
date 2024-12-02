import { List, Icon, Spin, Alert } from "antd"
import { useEffect, useState } from "react";
import { IMeta } from "..";
import { getWidgetData } from "../../services/elasticsearch";
import plugins from '../plugins';

export default (props: IMeta & {
    queries: {
        indexPattern: string;
        clusterId: string;
        timeField: string;
        getFilters: () => any;
        getBucketSize: () => string;
    };
    onAdd: () => void;
}) => {

    const { queries, title, series, description, onAdd } = props;
    const { type, metric, options } = series[0]
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState<any>();
    const [loading, setLoading] = useState<boolean>(false);

    const getData = async () => {
        setLoading(true)
        const { items } = metric || {}
        const res = await getWidgetData({ 
            ...queries,
            cluster_id: queries.clusterId,
            filter: queries.getFilters(),
            items,
            bucketSize: queries.getBucketSize(),
        });
        setData(res)
        setLoading(false)
    }

    const renderChart = (type: string, data: any, options: any) => {
        const Chart = plugins.find((p) => p.type === type);
        if (!Chart || !Chart.component) return <Alert message="This widget type is not supported at the moment" type="error" />;
        if (!data) return null;
        const { groups } = metric;
        if (groups) {
            options.seriesField = 'group'
        } else {
            delete options.seriesField
        }
        return <Chart.component data={data} options={options}/>
    }

    useEffect(() => {
        if (visible) {
            getData()
        }
    }, [visible])

    return (
        <>
            <List.Item
                actions={[
                <a key="preview" title={visible ? 'hidden' : 'show'} onClick={() => setVisible(!visible)}>
                    {<Icon type={"pie-chart"}/>}
                </a>, 
                <a key="add" title="add to dashboard" onClick={onAdd}>
                    <Icon type={"plus"} />
                </a>
            ]}
            >
                <List.Item.Meta
                    title={<div style={{ wordBreak: 'break-all'}}>{title}</div>}
                    description={description}
                />
            </List.Item> 
            {
                visible && (
                    <Spin spinning={loading}>
                        <div style={{height: 200}}>
                            {renderChart(type, data, options)}
                        </div>
                    </Spin>
                )
            }
        </>
    )
}