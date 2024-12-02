import { Icon, Tag } from "antd";

export const FilteredTags = ({ filters, onTagClose }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: 5,
      }}
    >
      <span style={{ paddingRight: 8 }}>
        <Icon type="filter" />
      </span>
      {Object.keys(filters || [])?.map((field) => {
        let subFilters = filters[field];
        return subFilters?.map((item, i) => {
          return (
            <Tag
              color="magenta"
              closable
              key={`${field}-${item}-${i}`}
              onClose={() => {
                if (typeof onTagClose == "function") {
                  onTagClose({
                    field,
                    value: subFilters.filter((v) => v != item),
                  });
                }
              }}
            >
              {item}
            </Tag>
          );
        });
      })}
    </div>
  );
};
