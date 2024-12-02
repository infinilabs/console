import Loading from "./loading.svg";
import styles from "./Loading.less";

export default (props) => {
    const { loading = true, currentLocales } = props;
    if (!loading) return null;
    return (
        <div className={styles.loading}>
            <img src={Loading}/>
            <div className={styles.tips}>{currentLocales["dropdownlist.loading"]}</div>
        </div>
    )
}