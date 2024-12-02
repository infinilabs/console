import { Button, Icon, Popover, message } from "antd";
import { useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import styles from "./index.less";

export default (props) => {
  const Content = (props) => {
    return (
      <div className={styles.viewConent}>
        <div className={styles.menu}>
          <div className={styles.title}>
            {formatMessage({ id: "listview.view" })}
          </div>
          <div className={styles.item}>
            <Icon type="table" />
            <div>Table</div>
          </div>
          <div className={styles.item}>
            <Icon type="appstore" />
            <div>Card View</div>
          </div>
          <div className={`${styles.item} ${styles.rightMore}`}>
            <div className={styles.left}>
              <Icon type="select" />
              fff
              <div>Custom</div>
            </div>
            <Icon className={styles.right} type="right" />
          </div>
          <div className={`${styles.item} ${styles.rightMore}`}>
            <div className={styles.left}>
              <Icon type="save" />
              <div>Save</div>
            </div>
            <Icon className={styles.right} type="right" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Popover
      content={<Content />}
      placement="bottomRight"
      overlayClassName={styles.popover}
    >
      <div className={`${styles.view}`}>
        <Icon type="layout" />
        <span>View</span>
        <Icon style={{ fontSize: 10 }} type="down" />
      </div>
    </Popover>
  );
};
