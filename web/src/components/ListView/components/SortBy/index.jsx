import { Input, Select, Button, Icon, Popover, message } from "antd";
import { useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import styles from "./index.less";

const { Option } = Select;

export default (props) => {
  const { options = [], value = [], onChange } = props;

  const FormContent = (props) => {
    const selectedSortDefault = [undefined, "desc"];
    const [selectedSort, setSelectedSort] = useState(value);

    const [selectedMap] = useMemo(() => {
      let selectedMap = {};
      selectedSort.map((item) => {
        selectedMap[item[0]] = item[1];
      });
      return [selectedMap];
    }, [selectedSort]);

    const onClear = () => {
      onChange([]);
    };

    const onApply = () => {
      let selected = selectedSort.filter((item) => item[0] && item[1]);
      onChange(selected);
    };
    return (
      <div className={styles.sortContent}>
        <div className={styles.title}>
          {formatMessage({ id: "listview.sort.by" })}
        </div>
        {(selectedSort.length > 0 ? selectedSort : [selectedSortDefault]).map(
          (item, i) => {
            let field = item[0];
            let type = item[1];
            return (
              <div key={`${field}${i}`} className={styles.select}>
                <Select
                  className={styles.field}
                  placeholder={formatMessage({
                    id: "listview.sort.select.placeholder",
                  })}
                  value={field}
                  onChange={(val) => {
                    if (selectedMap.hasOwnProperty(val)) {
                      message.warn("Duplicate sort field");
                      return;
                    }
                    item[0] = val;
                    let tmp = selectedSort;
                    tmp[i] = item;
                    setSelectedSort([...tmp]);
                  }}
                >
                  {options.map((option) => {
                    return (
                      <Option key={option.key} value={option.key}>
                        {option.label}
                      </Option>
                    );
                  })}
                </Select>
                <Select
                  className={styles.type}
                  placeholder={formatMessage({ id: "listview.sort.by.desc" })}
                  value={type}
                  onChange={(val) => {
                    item[1] = val;
                    let tmp = selectedSort;
                    tmp[i] = item;
                    setSelectedSort([...tmp]);
                  }}
                >
                  <Option value="desc">
                    {formatMessage({ id: "listview.sort.by.desc" })}
                  </Option>
                  <Option value="asc">
                    {formatMessage({ id: "listview.sort.by.asc" })}
                  </Option>
                </Select>

                <div className={styles.actions}>
                  {selectedSort.length > 1 ? (
                    <Icon
                      type="close-circle"
                      onClick={() => {
                        setSelectedSort(
                          selectedSort.filter(
                            (selected) => selected[0] != field
                          )
                        );
                      }}
                    />
                  ) : null}

                  {i == 0 && selectedSort.length < options.length ? (
                    <Icon
                      type="plus-circle"
                      onClick={() => {
                        setSelectedSort([...selectedSort, selectedSortDefault]);
                      }}
                    />
                  ) : null}
                </div>
              </div>
            );
          }
        )}

        <div className={styles.footer}>
          <Button type="link" onClick={onClear}>
            {formatMessage({ id: "listview.sort.by.clear" })}
          </Button>
          <Button type="primary" onClick={onApply}>
            {formatMessage({ id: "listview.apply" })}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Popover
      content={<FormContent />}
      placement="bottom"
      overlayClassName={styles.popover}
    >
      <div className={`${styles.sortBy}`}>
        <Icon type="sort-ascending" />
        <span>{formatMessage({ id: "listview.sort" })}</span>
        {value.length > 0 ? (
          <span className={styles.sortCount}>{value.length}</span>
        ) : null}
      </div>
    </Popover>
  );
};
