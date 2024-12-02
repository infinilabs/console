import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import styles from "./index.less"
import { Dropdown, Icon, Menu } from "antd"

export default forwardRef((props, ref) => {
    const { menu, children } = props;

    useImperativeHandle(ref, () => ({
    }));

    const menuUI = (
        <Menu>
            {
                menu.map((item) => (
                    <Menu.Item key={item.type}>
                        <a className={`${styles.item} ${item.disabled ? styles.disabled : ''}`}  onClick={() => {
                            if (!item.disabled) item.onClick()
                        }}>
                            {item.icon}
                            {item.name}
                        </a>
                    </Menu.Item>
                ))
            }
        </Menu>
    );

    return (
        <Dropdown overlayClassName={styles.dropdownMenu} overlay={menuUI} placement="bottomCenter" trigger={['click']}>
            {children}
        </Dropdown>
    )
})