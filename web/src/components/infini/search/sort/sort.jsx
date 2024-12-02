import { Input, Select } from "antd";
const InputGroup = Input.Group;
const Option = Select.Option;

const Sorter = ({ options, value = [], onChange }) => {
  let [field, direction] = value;
  const onFieldChange = (v) => {
    if (typeof onChange == "function") {
      if (v == "relevance") {
        onChange([]);
        return;
      }
      onChange([v, direction || "desc"]);
    }
  };
  const onDirectionChange = (v) => {
    if (typeof onChange == "function") {
      onChange([field, v]);
    }
  };

  return (
    <div>
      <div style={{ color: "#8b9bad" }}>SORT BY</div>
      <InputGroup compact style={{ minWidth: 200, margin: "5px 0px" }}>
        <Select
          style={{ width: field ? "60%" : "100%" }}
          value={field || "relevance"}
          onChange={onFieldChange}
        >
          <Option key="relevance" value="relevance">
            Relevance
          </Option>
          {(options || []).map((op) => {
            return (
              <Option key={op.key} value={op.key}>
                {op.label}
              </Option>
            );
          })}
        </Select>
        {field && (
          <Select
            style={{ width: "40%" }}
            onChange={onDirectionChange}
            value={direction || "desc"}
          >
            <Option value="desc">DESC</Option>
            <Option value="asc">ASC</Option>
          </Select>
        )}
      </InputGroup>
    </div>
  );
};

export default Sorter;
