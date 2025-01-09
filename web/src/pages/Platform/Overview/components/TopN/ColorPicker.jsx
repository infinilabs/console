import { Button, Popover } from "antd";
import styles from "./ColorPicker.less";
import { SketchPicker } from 'react-color';
import { useEffect, useRef, useState } from 'react';
import { formatMessage } from "umi/locale";

export default (props) => {
    const { children, color, onChange, onRemove } = props;

    const [currentColor, setCurrentColor] = useState();

    const targetRef = useRef(null)

    const onClose = () => {
        targetRef?.current?.click()
    }

    useEffect(() => {
        setCurrentColor(color)
    }, [color])

    return (
        <Popover overlayClassName={styles.colorPicker} placement="right" trigger="click" content={(
            <div>
                <div>
                    <SketchPicker 
                        color={ currentColor }
                        onChangeComplete={(color) => setCurrentColor(color.hex) }
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 10px 10px' }}>
                    <Button size="small" onClick={() => onClose()}>{formatMessage({ id: 'form.button.cancel'})}</Button>
                    { onRemove && <Button type="danger" size="small" onClick={() => {
                        onRemove()
                        onClose()
                    }}>{formatMessage({ id: 'form.button.delete'})}</Button>}
                    <Button type="primary" size="small" onClick={() => {
                        onChange(currentColor)
                        onClose()
                    }}>{formatMessage({ id: 'form.button.ok'})}</Button>
                </div>
            </div>
        )}>
            <div ref={targetRef}>
                {children}
            </div>
        </Popover>
    )
}