import React from "react";
import { Avatar, List, Icon } from "antd";
import classNames from "classnames";
import styles from "./NoticeList.less";
import { MessageIcon } from "@/components/infini/Icons";

export default function NoticeList({
  data = [],
  onClick,
  onClear,
  title,
  locale,
  emptyText,
  emptyImage,
  showClear = true,
  showViewMore = true,
  onViewMore,
}) {
  if (data.length === 0) {
    return (
      <div className={styles.notFound}>
        {emptyImage ? <img src={emptyImage} alt="not found" /> : null}
        <div>{emptyText || locale.emptyText}</div>
      </div>
    );
  }
  return (
    <div>
      <List className={styles.list}>
        {data.map((item, i) => {
          const itemCls = classNames(styles.item, {
            [styles.read]: item.read,
          });
          // eslint-disable-next-line no-nested-ternary
          const leftIcon = <MessageIcon width="32px" />;

          return (
            <List.Item
              className={itemCls}
              key={item.key || i}
              onClick={() => onClick(item)}
            >
              <List.Item.Meta
                className={styles.meta}
                avatar={<span className={styles.iconElement}>{leftIcon}</span>}
                title={
                  <div className={styles.title}>
                    {item.title}
                    <div className={styles.extra}>{item.extra}</div>
                  </div>
                }
                description={
                  <div>
                    {/* <div className={styles.description} title={item.body}>
                      {item.body}
                    </div> */}
                    <div className={styles.datetime}>{item.datetime}</div>
                  </div>
                }
              />
            </List.Item>
          );
        })}
      </List>

      <div className={styles.bottomBar}>
        {showClear ? <div onClick={onClear}>{locale.clear}</div> : null}
        {showViewMore ? (
          <div onClick={onViewMore}>{locale.viewMoreText}</div>
        ) : null}
      </div>
    </div>
  );
}
