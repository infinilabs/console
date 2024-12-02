import { Card, Button } from "antd";
import { Fragment } from "react";
import styles from "./index.less";
import { formatMessage } from "umi/locale";

export default (props) => {
  const { rowSize = 0, style = {}, onUnselect, extra = [] } = props;

  return rowSize > 0 ? (
    //multiple rows options
    <div className={`${styles.rowSelect}`} style={{ ...style }}>
      <Card
        className={styles.card}
        bodyStyle={{ paddingTop: 15, paddingBottom: 15 }}
      >
        <div className={styles.content}>
          <span className={styles.left}>
            <span>
              {formatMessage(
                { id: "listview.rows.selected" },
                { total: rowSize }
              )}
            </span>
            <Button type="link" onClick={onUnselect}>
              {formatMessage({ id: "listview.rows.unselect" })}
            </Button>
          </span>
          <span className={styles.right}>
            {extra.map((item, index) => (
              <Fragment key={index}>{item}</Fragment>
            ))}
          </span>
        </div>
      </Card>
    </div>
  ) : null;
};
