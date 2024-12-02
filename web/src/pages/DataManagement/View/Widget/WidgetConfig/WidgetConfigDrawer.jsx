import { Drawer, Empty } from "antd"
import { formatMessage } from "umi/locale";
import styles from "./WidgetConfigDrawer.less"
import WidgetConfig from ".";
import { generateId } from "@/utils/utils";
import { WIDGETS } from "../widgets";
import { useMemo } from "react";
import { DEFAULT_COLS } from "../../LayoutGrid";
import WidgetConfigForm from "./WidgetConfigForm";

export default (props) => {

    const { visible, onVisibleChange, record, ...restProps } = props;

    const formatRecord = useMemo(() => {
        if (!visible) return;
        if (record) return record
        const item = WIDGETS[0]
        if (!item) return;
        return {
            ...item,
            position: {
                x: 0,
                y: 0,
                w: DEFAULT_COLS,
                h: item.defaultH,
            },
            id: generateId(16),
            title: `New Widget`,
            desc: `New Widget`,
            series: [
                { type: item.type }
            ]
        }
    }, [record, visible])

    return (
        <Drawer
          title={formatMessage({id: "dashboard.widget.setting.title"})}
          visible={visible}
          bodyStyle={{ 
            padding: 0,
            height: "calc(100vh - 55px)",
          }}
          wrapClassName={styles.widgetConfig}
          onClose={() => onVisibleChange(false)}
          destroyOnClose
      >
        {
            formatRecord ? (
                <WidgetConfigForm 
                    {...restProps}
                    record={formatRecord}
                    onCancel={() => onVisibleChange(false)}
                />
            ) : <Empty />
        }
      </Drawer>
    )
}