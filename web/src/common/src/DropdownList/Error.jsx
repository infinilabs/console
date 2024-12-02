import styles from "./Error.less";
import { Icon } from "antd";

export default (props) => {
    const { currentLocales, failed = true } = props;
    if (!failed) return null;
    return (
        <div className={styles.error}>
            <Icon type="close-circle" />
            <div className={styles.tips}>{currentLocales["dropdownlist.loading.failed"]}</div>
        </div>
    )
}