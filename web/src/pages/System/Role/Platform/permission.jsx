import { Tree, Icon, Radio } from "antd";
import React from "react";
import { formatMessage } from "umi/locale";
const { TreeNode } = Tree;
import "./permission.scss";
const PermissionContext = React.createContext({});

const renderTree = ({ key, children, menuKey }, onValueChange) => {
  if (children && children.map) {
    return (
      <TreeNode
        selectable={false}
        title={
          <PermissionTitle
            title={formatMessage({
              id: `menu.${menuKey || key}`,
            })}
            id={key}
            onChange={onValueChange}
            showOptions={typeof children == "undefined"}
          />
        }
        key={key}
      >
        {children.map((childData) => {
          return renderTree(childData, onValueChange);
        })}
      </TreeNode>
    );
  }
  return (
    <TreeNode
      selectable={false}
      title={
        <PermissionTitle
          title={formatMessage({
            id: `menu.${menuKey || key}`,
          })}
          onChange={onValueChange}
          id={key}
          showOptions={typeof children == "undefined"}
        />
      }
      key={key}
    />
  );
};

export default ({ data, value, onChange }) => {
  const onValueChange = (pitem) => {
    let permissions = value || [];
    const newTemps = (pitem || "").split(":");
    const srcIndex = permissions.findIndex((p) => {
      return (
        p == newTemps[0] + ":all" ||
        p == newTemps[0] + ":read" ||
        p == newTemps[0] + ":none"
      );
    });
    if (srcIndex > -1) {
      permissions[srcIndex] = pitem;
    } else {
      permissions.push(pitem);
    }
    permissions = permissions.filter((p) => !p.endsWith(":none"));
    if (typeof onChange == "function") {
      onChange(permissions);
    }
  };
  data = data || [];
  return (
    <PermissionContext.Provider value={{ value }}>
      <Tree switcherIcon={<Icon type="down" />}>
        {data.map((item) => {
          return renderTree(item, onValueChange);
        })}
      </Tree>
    </PermissionContext.Provider>
  );
};

const PermissionTitle = ({ id, title, onChange, showOptions }) => {
  const { value } = React.useContext(PermissionContext);
  const targetItem = (value || []).find((item) =>
    [`${id}:all`, `${id}:read`].includes(item)
  );
  const privilege = targetItem;
  const onPermissionChange = (ev) => {
    if (typeof onChange == "function") {
      onChange(ev.target.value);
    }
  };
  const enumValues = [
    {
      label: "All",
      value: `${id}:all`,
    },
    {
      label: "Read",
      value: `${id}:read`,
    },
    {
      label: "None",
      value: `${id}:none`,
    },
  ];
  return (
    <div className="permission-title">
      <div>{title}</div>
      {showOptions ? (
        <div className="values">
          <Radio.Group
            size="small"
            buttonStyle="solid"
            defaultValue={privilege || `${id}:none`}
            onChange={onPermissionChange}
          >
            {enumValues.map((item) => {
              return (
                <Radio.Button key={item.label} value={item.value}>
                  {item.label}
                </Radio.Button>
              );
            })}
          </Radio.Group>
        </div>
      ) : null}
    </div>
  );
};
