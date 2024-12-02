import { Checkbox, Icon, Input } from "antd";
import { useEffect, useState } from "react";
import "./search_facet.scss";

const SearchFacet = ({ field, label, data = [], onChange, selectedKeys }) => {
  const [filterData, setFilterData] = useState([]);
  const onInputChange = (ev) => {
    setFilterData(data.filter((item) => item.key.includes(ev.target.value)));
  };

  useEffect(() => {
    setFilterData([...data]);
  }, [data, selectedKeys]);
  const onSelectChange = (item, ev) => {
    if (ev.target.checked) {
      if (selectedKeys.indexOf(item.key) > -1) {
        return;
      }
      const newKeys = [...selectedKeys, item.key];
      if (typeof onChange == "function") {
        onChange({
          field,
          value: newKeys,
        });
      }
    } else {
      const newKeys = selectedKeys.filter((key) => key != item.key);
      if (typeof onChange == "function") {
        onChange({
          field,
          value: newKeys,
        });
      }
    }
  };
  const [showMore, setShowMore] = useState(false);
  return (
    <div className="search-facet">
      <div className="search-facet-line label">{label}</div>
      <div className="search-facet-line">
        <Input placeholder={`Filter ${label}`} onChange={onInputChange} />
      </div>
      <div className="search-facet-line">
        {(showMore ? filterData : filterData.slice(0, 5)).map((item) => {
          return (
            <div key={item.key} className="search-facet-value">
              <Checkbox
                onChange={(v) => {
                  onSelectChange(item, v);
                }}
                checked={selectedKeys && selectedKeys.indexOf(item.key) > -1}
              >
                {item.key}
              </Checkbox>
              <div className="count">{item.doc_count}</div>
            </div>
          );
        })}
        {!showMore && filterData.length > 5 ? (
          <div>
            <a
              onClick={() => {
                setShowMore(true);
              }}
            >
              <Icon type="plus" />
              more
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchFacet;
