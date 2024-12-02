import { Card, Col, Row } from "antd"
import styles from './index.less';
import Layouts from '../Layouts'
import { DEFAULT_COLS } from "../constants/layout";
import GridContainer from "../GridContainer";

interface IProps {
  layout?: any;
  onChange: (layout: any) => void;
}

const COLORS = {
  'line': '#1890ff',
  'column': '#13c2c2'
}

export default (props: IProps) => {

    const { layout, onChange } = props;

    const { id } = layout || {};

    const findMaxY = (layout: any) => {
      let maxY = 0;
      layout.forEach((item) => {
        const { position: { y, h }} = item;
        const tmpY = y + h;
        maxY = tmpY > maxY ? tmpY : maxY;
      })
      return maxY
    }

    return (
      <Row gutter={16}>
        {
          Layouts.map((item) => {
            const bodyHeight = 300
            const padding = 12;
            const gridHeight = bodyHeight - padding * 2
            const maxY = findMaxY(item.layout)
            const rowHeight = (gridHeight - (maxY - 1)*10) / maxY; 
            return (
              <Col span={12} key={item.id}>
                <Card 
                  className={id === item.id ? styles.selectedLayout  : ''} 
                  title={item.title}
                  size="small" 
                  bodyStyle={{ height: bodyHeight }} 
                  hoverable
                  onClick={() => onChange(item)}
                  style={{marginBottom: 16}}
                >
                  <GridContainer
                    cols={DEFAULT_COLS}
                    isLocked={true}
                    isResizable={false}
                    rowHeight={rowHeight}
                  >
                    {item.layout.map((l, index) => (
                      <div 
                        key={index} 
                        data-grid={{...l.position, i: `${index}`}}
                        style={{ background: COLORS[l.type], color: '#fff'}}
                      >
                        {l.name}
                      </div>
                    ))}
                  </GridContainer>
                </Card>
              </Col>
            )
          })
        }
      </Row>
    )
}