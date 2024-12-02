import { Icon, Tooltip } from "antd";

export const FieldFilterFacet = ({ field, value, onClick, style = {} }) => {
  const onClickFilter = (e, field, val) => {
    e.stopPropagation();
    onClick({ field: field, value: [val] });
  };
  return (
    <span
      onClick={(e) => onClickFilter(e, field, value)}
      style={{ paddingLeft: 2, ...style }}
    >
      <Tooltip title="Click to quick filter">
        <Icon type="filter" />
      </Tooltip>
    </span>
  );
};
