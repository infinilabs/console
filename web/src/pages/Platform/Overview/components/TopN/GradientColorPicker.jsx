import { Button, Popover } from "antd";
import ColorPicker from "./ColorPicker";
import styles from "./GradientColorPicker.less"
import { useMemo } from "react";

export default ({ value = [], onChange, style = {}, className = '' }) => {

    const background = useMemo(() => {
        if (value.length === 0) return undefined
        if (value.length === 1) return value[0]
        const each_percent = Math.round(100 / (value.length - 1))
        return `linear-gradient(to right, ${value.map((item, index) => `${item} ${each_percent * index}%`).join(', ')})`
    }, [JSON.stringify(value)])

    const handleChange = (color, index) => {
      const newValue = [...value];
      newValue[index] = color
      onChange(newValue)
    }

    const onAdd = (color) => {
      const newValue = [...value];
      newValue.push(color)
      onChange(newValue)
    }

    const onRemove = (index) => {
      const newValue = [...value];
      newValue.splice(index, 1)
      onChange(newValue)
    }

    return (
        <Popover overlayClassName={styles.colors} placement="bottom" trigger="click" content={(
            <div>
              {
                value.map((item, index) => (
                  <ColorPicker key={index} color={item} onRemove={() => onRemove(index)} onChange={(color) => handleChange(color, index)}>
                    <Button style={{ padding: 3, width: 84, marginBottom: 8 }} size="small" >
                      <div style={{ background: item, width: '100%', height: 16 }}></div>
                    </Button>
                  </ColorPicker>
                ))
              }
              <ColorPicker onChange={onAdd}>
                <Button size="small" icon="plus" style={{ width: 84 }}></Button>
              </ColorPicker>
            </div>
        )}>
            <div className={className} style={{ padding: '10px 8px', border: '1px solid #d9d9d9', width: 100, height: 32, cursor: 'pointer', ...style }}>
                <div style={{ background, height: 12}}></div>
            </div>
        </Popover>
    );
};