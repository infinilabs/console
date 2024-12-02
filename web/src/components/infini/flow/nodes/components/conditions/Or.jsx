import { getDropdownMenu, getConditionMap } from "./util";

const componentsMap = {
  ...getConditionMap(),
};

export default ({
  label = "or",
  value = { conditions: [], condition_type: "or" },
}) => {
  return (
    <div>
      <div>
        <Dropdown overlay={menu}>
          <Button type="primary" size="small">
            {value.condition_type}
            <Icon type="plus" />
          </Button>
        </Dropdown>
      </div>
      {value.conditions.map((cond) => {
        return (
          <CondRow
            value={value}
            rowID={rowID}
            level={level}
            onChange={(v) => {
              // this.handleValueChange(v, i);
            }}
            onRemove={onRemove}
          />
        );
      })}
    </div>
  );
};
