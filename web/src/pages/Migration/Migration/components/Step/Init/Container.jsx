import {Icon} from "antd";
import { useCallback, useState } from "react";

export const Container = ({title, children, collapsed = true})=>{
  const [innerCollapsed, setInnerCollapsed] = useState(collapsed);
  const onCollapseClick = useCallback(()=>{
    setInnerCollapsed(v=>!v);
  },[setInnerCollapsed])
  return <div>
    <div className="header" style={{display:"flex", alignItems: "center", margin:"10px 0"}}>
      <div style={{fontSize: "16px", fontWeight: 500, flex:"none"}}>{title}</div>
      <div style={{borderTop: "1px solid #e8e8e8", flex:"1 1 auto", margin:"0 10px"}}></div>
      <div style={{flex:"none"}}>{<Icon onClick={onCollapseClick} style={{color: "#1890ff"}} type={innerCollapsed ? "down": "up"}/>}</div>
    </div>
    <div style={{display: innerCollapsed ? "none": "block", marginBottom: 30}}>
      {children}
    </div>
  </div>
}