import { Button, Drawer, Icon } from "antd"
import { forwardRef, useImperativeHandle, useState } from "react";
import styles from "./AddWidgetDrawer.less";
import { WIDGETS } from "./Widget/widgets"
import { formatMessage } from "umi/locale";

export default forwardRef((props, ref) => {

    const { onWidgetAdd } = props;

    const [visible, setVisible] = useState(false);

    const [selectedItem, setSelectedItem] = useState();

    useImperativeHandle(ref, () => ({
        open: () => setVisible(true),
        close: () => setVisible(false)
    }));

    const onItemSelect = (item) => {
        setSelectedItem(item)
    }

    return (
        <Drawer
            onClose={() => {
                setVisible(false)
            }}
            visible={visible}
            title={formatMessage({ id: "dashboard.widget.add.title" })}
            width={580}
          >
            <div className={styles.addWidgetDrawer}>
                <div className={styles.list}>
                    <div className={styles.title}>
                        {formatMessage({ id: "dashboard.widget.add.type.visualization" })}
                    </div>
                    <div className={styles.content}>
                        {
                            WIDGETS.map((item) => (
                                <div 
                                    key={item.type} 
                                    className={`${styles.item} ${item.type === selectedItem?.type ? styles.selected : ''}`} 
                                    onClick={() => onItemSelect(item)}
                                >
                                    { item.icon && <Icon className={styles.icon} component={item.icon} /> }
                                    <div className={styles.name}>{item.displayName}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
                <div className={styles.actions}>
                    <Button type="primary" size="small" onClick={() => {
                        if (selectedItem) {
                            onWidgetAdd(selectedItem)
                            setVisible(false)
                            setSelectedItem()
                        }
                    }}>{formatMessage({id: "dashboard.widget.action.add"})}</Button>   
                </div>
            </div>
        </Drawer>
    )
})