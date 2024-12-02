import { Icon } from "antd";
import styles from "./index.less";
import { formatMessage } from "umi/locale";

export default (props) => {
  const { icon, title } = props;

  return (
    <div className={styles.iconTitle}>
      <span className={styles.icon}>{icon()}</span>
      <div className={styles.text}>
        {formatMessage({ id: `overview.title.${title}` })}
      </div>
    </div>
  );
};
