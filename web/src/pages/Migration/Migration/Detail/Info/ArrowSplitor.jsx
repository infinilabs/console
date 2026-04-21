import DirectionArrow from "@/components/Icons/DirectionArrow";
import "./ArrowSplitor.scss";
import { Icon } from "antd";

export default ({color, showLeftArrow=false})=>{
  return (
  <div className="arrow-splitor">
    {showLeftArrow ? <div className="arrow la" style={{color: color? color:""}}>
      <Icon component={DirectionArrow}/>
    </div>: null}
    <div className="left" style={{background: color? color:""}}></div>
    <div className="arrow" style={{color: color? color:""}}>
      <Icon component={DirectionArrow}/>
    </div>
  </div>
  )
}