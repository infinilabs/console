import { useState, useCallback } from "react";
import { Tag, Input, Icon, message } from "antd";
import { formatMessage } from "umi/locale";

export default ({ value = [], onChange }) => {
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputConfirm = useCallback(
    (e) => {
      if (e.target.value.length == 0) {
        return message.warning(
          formatMessage({ id: "command.message.invalid.tag" })
        );
      }
      if (e.target.value != "") onChange([...(value || []), e.target.value]);
      setInputVisible(false);
      setInputValue("");
    },
    [value]
  );

  const handleRemove = useCallback(
    (index) => {
      const newValue = [...value];
      newValue.splice(index, 1);
      onChange(newValue);
    },
    [value]
  );

  return (
    <div>
      {value.map((tag, index) => (
        <Tag
          key={index}
          closable
          style={{ padding: "0 5px", fontSize: 14, margin: "5px 10px 5px 0" }}
          onClose={() => handleRemove(index)}
        >
          {tag}
        </Tag>
      ))}
      {inputVisible && (
        <Input
          value={inputValue}
          onChange={handleInputChange}
          style={{ width: 100 }}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
        />
      )}
      {!inputVisible && (
        <Tag onClick={showInput} style={{ padding: "0 5px", fontSize: 14 }}>
          <Icon type="plus" /> Add New
        </Tag>
      )}
    </div>
  );
};
