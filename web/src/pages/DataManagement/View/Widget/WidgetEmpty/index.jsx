import { Icon, Popconfirm } from 'antd';
import styles from './index.less';

export default (props) => {

    const { record, handleRemove, handleEdit } = props;
    const { displayName } = record;

    return (
        <div className={`${styles.empty} widget-drag-handle`}>
            <Popconfirm
                title={"Sure to delete?"}
                onConfirm={() => handleRemove(record)}
            >
                <div className={styles.remove}>x</div>
            </Popconfirm>
            { displayName }
            <Icon 
                className={styles.edit} 
                type="edit" 
                theme="filled" 
                onClick={handleEdit}
            />
        </div>
    )
}