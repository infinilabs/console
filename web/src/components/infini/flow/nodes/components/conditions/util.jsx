import Contains from "./Contains";
import Equals from "./Equals";
import Regexp from "./Regexp";

export const getDropdownMenu = (onAddClick) => {
  return (
    <Menu onClick={onAddClick}>
      <Menu.Item key="equals">equals</Menu.Item>
      <Menu.Item key="contains">contains</Menu.Item>
      <Menu.Item key="regexp">regexp</Menu.Item>
      <Menu.Item key="range">range</Menu.Item>
      <Menu.Item key="network">network</Menu.Item>
      <Menu.Item key="has_fields">has_fields</Menu.Item>
      <Menu.Item key="in">in</Menu.Item>
      <Menu.Item key="queue_has_lag">queue_has_lag</Menu.Item>
      <Menu.Item key="cluster_available">cluster_available</Menu.Item>
      <Menu.Item key="or">or</Menu.Item>
      <Menu.Item key="and">and</Menu.Item>
      <Menu.Item key="not">not</Menu.Item>
    </Menu>
  );
};
export const getConditionMap = () => {
  return {
    equals: Equals,
    contains: Contains,
    regexp: Regexp,
  };
};
