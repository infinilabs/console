import { Dropdown, Icon, Menu } from "antd";
import { cloneDeep } from "lodash";

export default (props) => {

    const { handleLayerChange, currentIndex = 0, groups } = props;

    const menu = (
      <Menu>
        <Menu.Item key="3" style={{ 
          background: '#fff', 
          cursor: 'default',
          fontWeight: 700,
          fontSize: 14,
          color: 'rgb(16, 16, 16)'
        }}>
          Groups
        </Menu.Item>
        {
          groups.map((item, index) => (
            <Menu.Item key={item.field} onClick={() => handleLayerChange(index)}>
              <span style={{ color: currentIndex === index ? '#007fff' : '#000'}}>{item.name || item.field}</span>
            </Menu.Item>
          ))
        }
      </Menu>
    );

    return (
        <Dropdown overlay={menu} placement="bottomRight">
          <Icon type="bars" />
        </Dropdown>
    )
}