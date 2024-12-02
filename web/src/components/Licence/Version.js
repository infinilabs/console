import { Descriptions } from "antd";
import moment from "moment";
import styles from "./Version.less";
import { DATE_FORMAT } from ".";
import Features from "./Features";
import Buy from "./Buy";
import { formatMessage } from "umi/locale";

export default ({ application, licence }) => {
  const { number, build_date, build_hash } = application?.version || {};

  return (
    <div className={styles.version}>
      <div className={styles.header}>
        <Descriptions size="small" title={`${APP_DOMAIN} Console`} column={1}>
          <Descriptions.Item
            label={formatMessage({ id: "license.label.version" })}
          >
            {number}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({ id: "license.label.build_time" })}
          >
            {moment(build_date).format(DATE_FORMAT)}
          </Descriptions.Item>
          <Descriptions.Item label="Hash">{build_hash}</Descriptions.Item>
        </Descriptions>
      </div>
      <Features licence={licence} />
      <Buy />
    </div>
  );
};
