import { Button } from "antd";
import styles from "./Buy.less";
import { formatMessage } from "umi/locale";
import ApplyTrial from "./ApplyTrial";

export default (props) => {
  return APP_OFFICIAL_WEBSITE ? (
    <div className={styles.buy}>
      {props?.trialVisible ? <ApplyTrial {...props} /> : null}

      <Button
        type="primary"
        size="small"
        onClick={() => window.open(APP_OFFICIAL_WEBSITE)}
      >
        {formatMessage({ id: "license.button.buy" })}
      </Button>
    </div>
  ) : null;
};
