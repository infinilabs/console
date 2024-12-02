import styles from './index.less';
import { Dropdown, Icon, Menu } from "antd";

interface IProps {
    draggableHandleCls: string;
    title: string;
    onSetting: () => void;
    onSave: () => void;
    onRemove: () => void;
}

export default (props: IProps) => {

    const { draggableHandleCls, title, onSetting, onSave, onRemove } = props;

    const menu = (
        <Menu>
            <Menu.Item onClick={onSetting}>
                <Icon 
                    type="setting" 
                />
                Setting
            </Menu.Item>
            {/* <Menu.Item>
                <Icon 
                    type="save" 
                />
                Save
            </Menu.Item> */}
            <Menu.Item  onClick={onRemove}>
                <Icon type="delete"/>
                Remove
            </Menu.Item>
        </Menu>
    );

    return (
        <div className={styles.header}>
            <div className={`${styles.title} ${draggableHandleCls}`}>{title}</div>
            <div className={styles.actions}>
                <Dropdown overlay={menu} placement="bottomRight" trigger={'click'}>
                    <Icon type="ellipsis" />
                </Dropdown>
            </div>
        </div>
    )
}