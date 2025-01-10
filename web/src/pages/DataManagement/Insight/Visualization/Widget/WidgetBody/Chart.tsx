import { Alert, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { IMeta } from '../..';
import { getWidgetData } from '../../../services/elasticsearch';
import plugins from '../../plugins';

interface IProps {
    queries: {
        indexPattern: string;
        clusterId: string;
        timeField: string;
        getFilters: () => any;
        getBucketSize: () => string;
    };
    record: IMeta;
}

export default (props: IProps) => {

    const { queries, record } = props;
    const { series } = record;

    const [loading, setLoading] = useState(false);

    const [data, setData] = useState<any>();

    const { type, metric, options } = series[0]

    const fetchData = async (queries: any, metric: any) => {
        setLoading(true)
        const res = await getWidgetData({ 
            ...queries,
            cluster_id: queries.clusterId,
            filter: queries.getFilters(),
            ...metric,
            bucketSize: queries.getBucketSize(),
        });
        if (res && !res.error) {
            setData(res.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData(queries, metric)
    }, [JSON.stringify(queries), JSON.stringify(metric)])

    const renderChart = (type: string, data: any, options: any) => {
        if (loading) return (
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin tip="calculating, please wait... "/>
            </div>
        )
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

    return (
        <div style={{width: '100%', height: '100%'}}>
            {renderChart(type, data, options)}
        </div>
    )
}