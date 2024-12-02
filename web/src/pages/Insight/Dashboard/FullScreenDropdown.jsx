import { Dropdown, Icon, Menu } from "antd";

export default (props) => {

    const { onFullScreen, onCarousel } = props;

    const menu = (
      <Menu>
        <Menu.Item key="3" style={{ 
          background: '#fff', 
          cursor: 'default',
          fontWeight: 700,
          fontSize: 14,
          color: 'rgb(16, 16, 16)'
        }}>
          Fullscreen
        </Menu.Item>
        <Menu.Item key={"current"} onClick={() => onFullScreen()}>
          <Icon type="fullscreen"/>
          Current Dashboard
        </Menu.Item>
        <Menu.Item key={"all"} onClick={() => onCarousel()}>
          <Icon type="play-square" />
          Loop All Dashboards
        </Menu.Item>
      </Menu>
    );

    return (
        <Dropdown overlay={menu} placement="bottomRight">
          <Icon type="fullscreen" />
        </Dropdown>
    )
}