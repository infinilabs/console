import styles from './index.less';
import Chart from './Chart';
import { IMeta } from '../..';

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

    return (
        <div className={styles.body}>
            <Chart {...props}/>
        </div>
    )
}