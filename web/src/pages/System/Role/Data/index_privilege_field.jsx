import useAsync from "@/lib/hooks/use_async";
import request from "@/utils/request";
import { Button, Input, Select, Icon } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataRoleFromContext } from "./context";
import { ESPrefix } from "@/services/common";
const InputGroup = Input.Group;
const Option = Select.Option;

const IndexPrivilegeField = ({ privileges = [], value = [], onChange }) => {
  const [innerValue, setInnerValue] = useState(value);
  const onInnerValueChange = (val, i) => {
    setInnerValue((st) => {
      const newVal = [...st];
      newVal[i] = {
        ...st[i],
        ...val,
      };
      if (typeof onChange == "function") {
        onChange(newVal);
      }
      return newVal;
    });
  };
  const onAddClick = () => {
    const newVal = [...innerValue, { _key: new Date().valueOf() }];
    setInnerValue(newVal);
    if (typeof onChange == "function") {
      onChange(newVal);
    }
  };

  const onRemoveClick = (i) => {
    setInnerValue((st) => {
      const newVal = [...st];
      newVal.splice(i, 1);
      if (typeof onChange == "function") {
        onChange(newVal);
      }
      return newVal;
    });
  };
  const indexPrivilegeEl = useMemo(() => {
    return innerValue.map((item, i) => {
      return (
        <div
          key={JSON.stringify(item)}
          style={{ display: "flex", alignItems: "center" }}
        >
          <IndexPrivilegeItem
            value={item}
            privileges={privileges}
            onChange={(val) => {
              onInnerValueChange(val, i);
            }}
          />
          <div style={{ marginLeft: 10 }}>
            <Icon
              type="close-circle"
              onClick={() => onRemoveClick(i)}
              style={{ fontSize: 18, cursor: "pointer" }}
            />
          </div>
        </div>
      );
    });
  }, [privileges, innerValue.length]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          color: "#999",
          lineHeight: "1.4em",
          marginTop: 10,
        }}
      >
        <div style={{ width: "50%" }}>Index</div>
        <div style={{ width: "50%" }}>Privilege</div>
      </div>
      {indexPrivilegeEl}
      <Button icon="plus" type="primary" onClick={onAddClick}>
        Add
      </Button>
    </div>
  );
};

export default IndexPrivilegeField;

const IndexPrivilegeItem = ({ privileges = [], value = {}, onChange }) => {
  const [innerValue, setInnerValue] = React.useState(value);
  const { selectedClusterIDs } = React.useContext(DataRoleFromContext);
  const [indices, setIndices] = React.useState([]);
  const { name, permissions } = innerValue;
  const onInnerIndexChange = (val) => {
    const newVal = {
      name: val,
      permissions,
    };
    setInnerValue(newVal);
    if (typeof onChange == "function") {
      onChange(newVal);
    }
  };
  const onInnerPrivilegeChange = (val) => {
    const newVal = {
      name,
      permissions: val,
    };
    setInnerValue(newVal);
    if (typeof onChange == "function") {
      onChange(newVal);
    }
  };

  const [isLoading, setIsLoading] = React.useState(false);
  const onIndexSearch = useCallback(
    _.debounce((text) => {
      if (!selectedClusterIDs || selectedClusterIDs.length == 0) {
        return;
      }
      if (isLoading) {
        return;
      }
      setIsLoading(true);
      let url = `${ESPrefix}/indices?ids=` + selectedClusterIDs.join(",");
      if (text) {
        url += `&keyword=${text}`;
      }
      request(url)
        .then((indicesRes) => {
          if (indicesRes && !indicesRes.error) {
            setIndices(indicesRes.indexnames || []);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 100),
    [selectedClusterIDs]
  );

  return (
    <div style={{ flex: "1 1 auto" }}>
      <InputGroup compact>
        <Select
          mode="tags"
          showSearch
          notFoundContent={null}
          style={{ width: "50%" }}
          defaultValue={name || []}
          onChange={onInnerIndexChange}
          onSearch={onIndexSearch}
        >
          {indices.map((indexName) => (
            <Option value={indexName} key={indexName}>
              {indexName}
            </Option>
          ))}
        </Select>
        <Select
          style={{ width: "50%" }}
          mode="tags"
          defaultValue={permissions || []}
          onChange={onInnerPrivilegeChange}
        >
          {privileges.map((pv) => (
            <Option value={pv} key={pv}>
              {pv}
            </Option>
          ))}
        </Select>
      </InputGroup>
    </div>
  );
};
