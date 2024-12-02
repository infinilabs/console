import { Empty } from "antd";
import styles from "./Empty.less";

export default (props) => {
    return (
        <div className={styles.empty}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}/>
        </div>
    )
}