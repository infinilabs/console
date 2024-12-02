import { Button, Form, Icon, Input, Popover, Select, Tabs } from "antd";
import { formatMessage } from "umi/locale";
import styles from "./index.less";
import { useEffect, useMemo, useState } from "react";
import Queries from "./Queries";
import { FORM_ITEM_LAYOUT } from "../../../Widget/WidgetConfig";
import DataSourceModal from "./DataSourceModal";

export default (props) => {

    const { globalQueries, customQueries, clusterList } = props;

    const { cluster_id, indices = [], time_field, range = {}, query, dsl, kql_filters = [] } = customQueries;

    const [visible, setVisible] = useState(false)

    const [isGlobalDataSource, setIsGlobalDataSource] = useState(!(cluster_id && indices.length > 0));

    const [isGlobalTimeField, setIsGlobalTimeField] = useState(isGlobalDataSource ? !time_field : false);

    const [isGlobalTimeRange, setIsGlobalTimeRange] = useState(!range.from || !range.to);

    const [isGlobalFilters, setIsGlobalFilters] = useState(isGlobalDataSource ? !dsl && kql_filters.length === 0 && !query : false);

    const [isFilterAdvanced, setIsFilterAdvanced] = useState(!!dsl || !!query);

    useEffect(() => {
        setIsGlobalDataSource(!(cluster_id && indices.length > 0))
    }, [cluster_id, indices.length])

    useEffect(() => {
        setIsGlobalTimeField(isGlobalDataSource ? !time_field : false)
    }, [time_field, isGlobalDataSource])

    useEffect(() => {
        setIsGlobalTimeRange(!range.from || !range.to)
    }, [range.from, range.to])

    useEffect(() => {
        setIsGlobalFilters(isGlobalDataSource ? !dsl && kql_filters.length === 0 && !query : false)
    }, [dsl, kql_filters.length, query, isGlobalDataSource])

    useEffect(() => {
        setIsFilterAdvanced(!!dsl || !!query)
    }, [dsl])

    return (
        <div className={styles.dataSource}>
            <Select 
                onFocus={() => setVisible(true)} 
                value={isGlobalDataSource} 
                style={{ width: 'calc(100% - 28px)' }} 
                open={false}
            >
                <Select.Option value={true}>
                    Use Dashboard's Setting
                </Select.Option>
                <Select.Option value={false}>
                    Custom
                </Select.Option>
            </Select>
            <DataSourceModal 
                visible={visible}
                setVisible={setVisible}
                globalQueries={globalQueries}
                customQueries={customQueries}
                clusterList={clusterList}
                isGlobalDataSource={isGlobalDataSource}
                setIsGlobalDataSource={setIsGlobalDataSource}
                isGlobalTimeField={isGlobalTimeField}
                setIsGlobalTimeField={setIsGlobalTimeField}
                isGlobalTimeRange={isGlobalTimeRange}
                setIsGlobalTimeRange={setIsGlobalTimeRange}
                isGlobalFilters={isGlobalFilters}
                setIsGlobalFilters={setIsGlobalFilters}
                isFilterAdvanced={isFilterAdvanced}
                setIsFilterAdvanced={setIsFilterAdvanced}
            />
        </div>
    )
}