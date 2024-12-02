import { useMemo } from 'react';
import { SizeMe } from 'react-sizeme';
import AutoFontSizer from './AutoFontSizer';

import styles from './Visualization.less'


export default (props: any) => {

  const { data, options} = props;

  const value = useMemo(() => {
    if (data.length === 0) return undefined
    return data[0].value
  }, [data])
  const unit = ''
  const desc = ''

  let content;

  if (value !== 0 && !value) {
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
        <div style={{width: '100%',height: desc ? '70%' : '100%'}}>
            <SizeMe monitorHeight monitorWidth>
              {({ size }) => (
                <AutoFontSizer height={size.height} width={size.width}>
                  <span>{value}{unit ? ` ${unit}` : ''}</span>
                </AutoFontSizer>
              )}
            </SizeMe>
          </div>
          {
            desc && (
              <div style={{width: '100%',height: '30%'}}>
                <SizeMe monitorHeight monitorWidth>
                  {({ size }) => (
                    <AutoFontSizer height={size.height} width={size.width}>
                      <span>{desc}</span>
                    </AutoFontSizer>
                  )}
                </SizeMe>
              </div>
            )
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
