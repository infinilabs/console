import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import styles from "./index.less"
import { Icon } from "antd"

export const TYPE_FIELD_FILTER = 'field_filter'
export const TYPE_HIGHLIGHT_MARK = 'highlight_mark'
export const TYPE_RANGE_FILTER = 'range_filter'
export const TYPE_DATA_DRILLING = 'data_drilling'

export default forwardRef((props, ref) => {
    const { menu, onClose } = props;
    const [visible, setVisible] = useState(false)
    const [position, setPosition] = useState({});
    const [params, setParams] = useState({})

    const menuRef = useRef(null)

    const handleClick = (e) => {
        if (menuRef.current) {
            const menuContainer = menuRef.current
            const boxLeft = menuContainer.offsetLeft
            const boxTop = menuContainer.offsetTop
            const boxRight = menuContainer.offsetTop + menuContainer.offsetWidth
            const boxBottom = menuContainer.offsetTop + menuContainer.offsetHeight
            const x = e.clientX;
            const y = e.clientY;
            const isOutSide = x < boxLeft || x > boxRight || y < boxTop || y > boxBottom
            if (isOutSide && visible) {
                setVisible(false)
                if (onClose) onClose()
            }
            
        }
    }

    useImperativeHandle(ref, () => ({
        open: (params, position) => {
            setParams(params)
            setPosition(position || {})
            setVisible(true)
        },
        close: () => {
            setVisible(false)
        }
    }));

    if (!visible) return null;

    return (
        <div className={styles.mask} onClick={handleClick}>
            <div className={styles.wrapper}>
                <div ref={menuRef} className={styles.contextMenu} style={{ left: position.x || 0, top: position.y || 0 }}>
                    <Icon className={styles.close} type="close-circle" onClick={() => {
                        setVisible(false)
                        if (onClose) onClose()
                    }}/>
                    {
                        menu.map((item) => (
                            <div key={item.type} className={`${styles.item} ${item.disabled ? styles.disabled : ''}`} onClick={() => {
                                if (!item.disabled) {
                                    setVisible(false)
                                    item.onClick(params)
                                }
                            }}>
                                {item.icon}
                                {item.name}
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
})