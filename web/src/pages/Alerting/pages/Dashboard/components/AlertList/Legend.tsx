import './legend.scss';
export interface LegendItem {
  color: string;
  title: string;
}

interface LegendProps{
  items: LegendItem[];
}

export const Legend = ({
  items
}:LegendProps)=>{
  return (
    <div className="legend-list">
      {(items || []).map(item=>{
        return <div className="legend-item">
          <span className="shape" style={{backgroundColor:item.color}}></span>
          <span className="text">{item.title}</span>
        </div>
      })}
    </div>
  )
  
}