import { useEffect, useState, useMemo } from 'react';
import { SizeMe } from 'react-sizeme';
import AutoFontSizer from './AutoFontSizer';

import styles from './Visualization.less'
import { formatValueByConfig } from '..';


export default (props) => {

  const { record, result, options, isGroup } = props;

  const { format } = record;

  const { data, unit } = result;

  const [valueFontSizes, setValueFontSizes] = useState([])
  const [groupFontSizes, setGroupFontSizes] = useState([])
  const [valueStyle, setValueStyle] = useState({})
  const [groupStyle, setGroupStyle] = useState({})

  const onValueFontSizeChange = (fontSize, index) => {
    const newFontSizes = [...valueFontSizes]
    newFontSizes[index] = fontSize
    setValueFontSizes(newFontSizes);
  }

  const onGroupFontSizeChange = (fontSize, index) => {
    const newFontSizes = [...groupFontSizes]
    newFontSizes[index] = fontSize
    setGroupFontSizes(newFontSizes);
  }

  const setFontSizeStyle = (fontSizes, data, style, setter) => {
    const filterSizes = fontSizes.filter((item) => Number.isInteger(item))
    if (filterSizes.length === data.length) {
      const min = Math.min(...filterSizes);
      if (Number.isInteger(min) && style.fontSize !== min) {
        setter({ fontSize: min })
      }
    }
  }

  let content;

  useEffect(() => {
    setFontSizeStyle(valueFontSizes, data, valueStyle, setValueStyle)
  }, [JSON.stringify(valueFontSizes), JSON.stringify(data), JSON.stringify(valueStyle)])

  useEffect(() => {
    setFontSizeStyle(groupFontSizes, data, groupStyle, setGroupStyle)
  }, [JSON.stringify(groupFontSizes), JSON.stringify(data), JSON.stringify(groupStyle)])

  if (data.length === 0) {
    content = (
      <SizeMe monitorHeight monitorWidth>
        {({ size }) => (
          <AutoFontSizer ratio={0.5} height={size.height} width={size.width}>
            <span>N/A</span>
          </AutoFontSizer>
        )}
      </SizeMe>
    );
  } else {
    content = (
      <>
        {
          data.map((item, index) => (
            <div key={isGroup ? item.group : index} style={{flex: 1, height: '100%'}}>
                <div style={{ height: isGroup ? '70%' : '100%', position: 'relative'}}>
                  <div className={styles.text} style={valueStyle}>
                    <span>{formatValueByConfig(item.value, format)}</span>
                  </div>
                  <div className={styles.ghost}>
                    <SizeMe monitorHeight monitorWidth>
                      {({ size }) => (
                        <AutoFontSizer 
                          height={size.height} 
                          width={size.width}
                          onFontSizeChange={(fontSize) => onValueFontSizeChange(fontSize, index)}
                        >
                          <span>{formatValueByConfig(item.value, format)}</span>
                        </AutoFontSizer>
                      )}
                    </SizeMe>
                  </div>
                </div>
                {
                  isGroup && (
                    <div style={{ height: '30%', position: 'relative'}}>
                      <div className={styles.text} style={groupStyle}>
                        <span>{item.group}</span>
                      </div>
                      <div className={styles.ghost}>
                        <SizeMe monitorHeight monitorWidth>
                          {({ size }) => (
                            <AutoFontSizer 
                              height={size.height} 
                              width={size.width}
                              onFontSizeChange={(fontSize) => onGroupFontSizeChange(fontSize, index)}
                            >
                              <span>{item.group}</span>
                            </AutoFontSizer>
                          )}
                        </SizeMe>
                      </div>
                    </div>
                  )
                }
            </div>
          ))
        }
      </>
    )
  }

  return (
      <div className={styles.container}>
          {content}
      </div>
  );
}
