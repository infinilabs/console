import { Icon, Input, List, Popover, Spin } from "antd";
import { IMeta } from "..";
import ListItem from "./ListItem";
import styles from './index.less';
import { useState } from "react";

interface IProps {
    queries: {
        indexPattern: string;
        clusterId: string;
        timeField: string;
        getFilters: () => any;
        getBucketSize: () => string;
    };
    loading: boolean;
    data: IMeta[];
    onAdd: (item: IMeta) => void;
}

export default (props: IProps) => {

    const { queries, loading, data, onAdd } = props;

    const [filterText, setFilterText] = useState('');

    const filterData = data.filter((item) => item.title.toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) !== -1);

    return (
        <Popover 
            arrowPointAtCenter
            placement="topRight" 
            title={"Metric List"} 
            overlayClassName={styles.list}
            content={(
              <div>
                <Input.Search
                  placeholder="input search title"
                  onSearch={setFilterText}
                  style={{ width: '100%', marginBottom: 18 }}
                />
                <List
                  loading={loading}
                  itemLayout="horizontal"
                  dataSource={filterData}
                  renderItem={item => (
                    <ListItem queries={queries} {...item} onAdd={() => onAdd(item)}/>
                  )}
                />
              </div>
            )} trigger="click">
                <div className={styles.action}>
                  {loading ? <Spin indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} /> : <Icon type={"pie-chart"} /> }
                </div>
        </Popover>
    )
}