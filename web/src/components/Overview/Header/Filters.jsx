import { Icon, Tag } from "antd";

export default ({ filters, onTagClose }) => {

  const tags = Object.keys(filters);

  if (tags.length === 0) return null;

  return (
    <div style={{ marginTop: 5 }} >
      <span style={{ paddingRight: 8 }}>
        <Icon type="filter" />
      </span>
      {tags.map((field) => {
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
