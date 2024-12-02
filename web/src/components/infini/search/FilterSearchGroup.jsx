import { Input, Select } from "antd";
const { Search } = Input;
const InputGroup = Input.Group;
const Option = Select.Option;

const FilterSearchGroup = ({
  enterButton = true,
  filterWidth = 120,
  filterFields,
  onFilterChange,
  onSearch,
  onChange,
}) => {
  return (
    <InputGroup compact>
      <Select
        allowClear={true}
        style={{ width: filterWidth }}
        dropdownMatchSelectWidth={false}
        placeholder="Filters"
        onChange={(value) => {
          if (typeof onFilterChange == "function") {
            onFilterChange(value);
          }
        }}
      >
        {Object.keys(filterFields).map((field) => {
          return (
            <Option key={field} value={field}>
              {filterFields[field]}
            </Option>
          );
        })}
      </Select>
      <Search
        enterButton={enterButton}
        allowClear={true}
        placeholder="Type keyword to search"
        style={{ width: `calc(100% - ${filterWidth}px)` }}
        onSearch={(value) => {
          if (typeof onSearch == "function") {
            onSearch(value);
          }
        }}
        onChange={(e) => {
          if (typeof onChange == "function") {
            onChange(e.currentTarget.value);
          }
        }}
      />
    </InputGroup>
  );
};

export default FilterSearchGroup;
