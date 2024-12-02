import { Drawer } from "antd"
import { forwardRef, useImperativeHandle, useState } from "react";

interface IProps {
    content: any;
    title?: any;
    placement?: string;
    closable?: boolean;
    zIndex?: number;
    width?: number;
    mask?: boolean;
    onClose?: () => void;
}

export interface IDrawerRef {
    open: () => void; 
    close: () => void;
}

export default forwardRef((props: IProps, ref: any) => {

    const {
        content,
        title,
        placement = 'right', 
        closable = true, 
        zIndex = 1001,
        width = 640,
        mask = false,
        onClose
    } = props;

    const [visible, setVisible] = useState(false);

    useImperativeHandle(ref, () => ({
        open: () => setVisible(true),
        close: () => setVisible(false)
    }));

    return (
        <Drawer
            destroyOnClose={true}
            placement={placement}
            closable={closable}
            zIndex={zIndex}
            width={width}
            onClose={() => {
                if (onClose) onClose()
                setVisible(false)
            }}
            visible={visible}
            mask={mask}
            title={title}
          >
            {content}
        </Drawer>
    )
})