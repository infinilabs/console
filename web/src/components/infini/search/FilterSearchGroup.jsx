import { Input, Select, Icon } from "antd";
import { formatMessage } from "umi/locale";

const { Search } = Input;
const InputGroup = Input.Group;
const Option = Select.Option;

const FilterSearchGroup = ({
  enterButton = formatMessage({ id: "form.button.search" }),
  filterWidth = 120,
  filterFields,
  filterValue,
  searchValue,
  onFilterChange,
  onSearch,
  onChange,
}) => {
  const handleClear = () => {
    if (typeof onFilterChange == "function") {
      onFilterChange(undefined);
    }
    if (typeof onChange == "function") {
      onChange("");
    }
    if (typeof onSearch == "function") {
      onSearch("");
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target?.value ?? "";
    if (!value && typeof onFilterChange == "function") {
      onFilterChange(undefined);
    }
    if (typeof onChange == "function") {
      onChange(value);
    }
  };

  return (
    <InputGroup compact>
      <Select
        allowClear={true}
        value={filterValue}
        style={{ width: filterWidth }}
        dropdownMatchSelectWidth={false}
        placeholder={formatMessage({ id: "listview.filters.placeholder" })}
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
        value={searchValue}
        suffix={
          <Icon
            type="close-circle"
            theme="filled"
            onClick={handleClear}
            style={{
              cursor: searchValue ? "pointer" : "default",
              color: "rgba(0,0,0,.25)",
              visibility: searchValue ? "visible" : "hidden",
              pointerEvents: searchValue ? "auto" : "none",
            }}
          />
        }
        placeholder={formatMessage({ id: "listview.search.placeholder" })}
        style={{ width: `calc(100% - ${filterWidth}px)` }}
        onSearch={(value) => {
          if (typeof onSearch == "function") {
            onSearch(value);
          }
        }}
        onChange={handleSearchChange}
      />
    </InputGroup>
  );
};

export default FilterSearchGroup;
