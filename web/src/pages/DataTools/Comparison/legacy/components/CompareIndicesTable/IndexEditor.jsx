import { useState } from "react";
import { Icon, Select } from "antd";
import styles from "./IndexEditor.scss";

export default ({ value, onChange, indices }) => {
  const [isEditting, setIsEditting] = useState(false);
  const [searchText, setSearchText] = useState();

  const onValueChange = (value) => {
    setIsEditting(false);
    const formatValue = value?.trim();
    if (formatValue) {
      onChange(formatValue);
      setSearchText();
    }
  };

  return (
    <div
      className={styles.indexEditor}
      style={{
        paddingRight: isEditting ? 0 : 18,
        margin: isEditting ? -8 : 0,
      }}
      onClick={() => {
        if (!isEditting) setIsEditting(true);
      }}
    >
      {isEditting ? (
        <Select
          showSearch
          value={value}
          style={{ width: "100%" }}
          dropdownMatchSelectWidth={false}
          open={isEditting}
          onBlur={() => onValueChange(searchText)}
          optionFilterProp="children"
          onSearch={(value) => setSearchText(value)}
          onSelect={onValueChange}
          filterOption={(input, option) =>
            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >=
            0
          }
        >
          {(indices || []).map((item) => (
            <Select.Option key={item.id} value={item.index}>
              {item.index}
            </Select.Option>
          ))}
        </Select>
      ) : (
        <span className={styles.text}>{value}</span>
      )}
      {!isEditting && <Icon className={styles.icon} type="down" />}
    </div>
  );
};
