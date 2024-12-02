import useFetch from "@/lib/hooks/use_fetch";
import { Table } from "antd";
import { ColumnProps } from "antd/lib/table";
import styles from './Table.scss';

interface IProps {
    title: string;
    action: string;
    rowKey: string;
    columns: ColumnProps<any>[];
    renderExtra?: (props: any) => React.ReactNode;
    formatValue?: (value: any) => any[];
}

export default (props: IProps) => {

    const { title, action, rowKey, columns, formatValue, renderExtra } = props;

    const { run, loading, value } = useFetch(action,{}, [action]);
    
    const extraElems = renderExtra ? renderExtra({ refresh: run }) : undefined

    return (
        <div style={{ marginTop: 20 }}>
            <div className={styles.header}>
                <h3>{title}</h3>
                { extraElems }
            </div>
            <Table
                bordered
                size={"small"}
                loading={loading}
                columns={columns}
                rowKey={rowKey}
                dataSource={(formatValue ? formatValue(value) : value) || []}
                pagination={false}
            />
        </div>
    );
  }