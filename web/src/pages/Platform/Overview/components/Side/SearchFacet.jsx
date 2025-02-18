import { Checkbox, Icon, Input } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";
import styles from "./SearchFacet.less";

export default ({ field, label, data = [], onChange, selectedKeys }) => {
  const [filterData, setFilterData] = useState([]);
  useEffect(() => {
    setFilterData(data);
  }, [data]);
  const onInputChange = (ev) => {
    let lowerStr = ev.target.value.toLowerCase();
    setFilterData(
      data.filter((item) => {
        let lowerKey = item.key.toLowerCase();
        return lowerKey.includes(lowerStr);
      })
    );
  };

  const onSelectChange = (item, ev) => {
    if (ev.target.checked) {
      if (selectedKeys.indexOf(item.key) > -1) {
        return;
      }
      const newKeys = [...selectedKeys, item.key];
      if (typeof onChange == "function") {
        onChange({
          field,
          value: newKeys,
        });
      }
    } else {
      const newKeys = selectedKeys.filter((key) => key != item.key);
      if (typeof onChange == "function") {
        onChange({
          field,
          value: newKeys,
        });
      }
    }
  };
  const [showMore, setShowMore] = useState(false);
  return (
    <div className={styles.searchFacet}>
      <div className={`${styles.line} ${styles.label}`}>{label}</div>
      <div className={styles.line}>
        <Input
          placeholder={`${formatMessage({
            id: "listview.side.filter",
          })} ${label}`}
          onChange={onInputChange}
        />
      </div>
      <div className={styles.line}>
        {(showMore ? filterData : filterData.slice(0, 5)).map((item) => {
          return (
            <div key={item.key} className={styles.value} title={item.key}>
              <Checkbox
                onChange={(v) => {
                  onSelectChange(item, v);
                }}
                checked={selectedKeys && selectedKeys.indexOf(item.key) > -1}
              >
                {item?.key_as_string ?? item.key}
              </Checkbox>
              <div className={styles.count}>{item.doc_count}</div>
            </div>
          );
        })}
        {!showMore && filterData.length > 5 ? (
          <div>
            <a
              onClick={() => {
                setShowMore(true);
              }}
            >
              <Icon type="plus" />
              more
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
};
