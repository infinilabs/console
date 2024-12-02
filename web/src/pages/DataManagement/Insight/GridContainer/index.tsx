import RGL, { WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import styles from './index.less'

const ReactGridLayout = WidthProvider(RGL);

const ROW_HEIGHT = 60
const MARGIN = 10

interface ILayout { i: string; x: number; y: number; w: number; h: number;}

interface IProps {
  onLayoutsChange?: (layout: ILayout[]) => void;
  cols?: number;
  rowHeight?: number;
  isResizable?: boolean;
  isLocked?: boolean;
  draggableHandleCls?: string;
  children?: React.ReactNode;
}

export default (props: IProps) => {
  const {
    onLayoutsChange,
    cols = 12,
    rowHeight = ROW_HEIGHT,
    isResizable = true,
    isLocked = false,
    children,
  } = props

  return (
    <div className={styles.gridContainer}>
      <ReactGridLayout
        cols={cols}
        rowHeight={rowHeight}
        containerPadding={[0, 0]}
        margin={[MARGIN, MARGIN]}
        isResizable={!isLocked && isResizable}
        isDraggable={!isLocked}
        onDragStop={onLayoutsChange}
        onResizeStop={onLayoutsChange}
        draggableHandle={'widget-drag-handle'}
      >
        {children}
      </ReactGridLayout>
    </div>
  )
}
