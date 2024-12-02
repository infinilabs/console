import { Select } from "antd";

const ClusterField = ({
  options = [],
  value = [],
  onChange,
  setSelectedClusterIDs,
}) => {
  const innerValue = value.map((item) => {
    return item.id;
  });
  const onInnerValueChange = (val) => {
    const newVal = val.map((key) => {
      if (key == "*") {
        return {
          id: "*",
          name: "*",
        };
      }
      const op = options.find((item) => item.id == key);
      if (op) {
        return {
          id: op.id,
          name: op.name,
        };
      }
      return {
        id: key,
        name: key,
      }
    });
    if (typeof onChange == "function") {
      onChange(newVal);
    }
    setSelectedClusterIDs(val);
  };
  const optionsEl = React.useMemo(() => {
    return options.map((op) => {
      return (
        <Select.Option key={op.id} value={op.id}>
          {op.name}
        </Select.Option>
      );
    });
  }, [options]);
  return (
    <Select
      showSearch
      mode="tags"
      defaultValue={innerValue}
      onChange={onInnerValueChange}
      filterOption={(input, option) =>
        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {optionsEl}
    </Select>
  );
};

export default ClusterField;
