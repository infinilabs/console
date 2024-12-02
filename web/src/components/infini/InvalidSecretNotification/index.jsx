import "./index.scss";
import { Link } from "umi";
import { Icon } from "antd";
import { formatMessage } from "umi/locale"; 

export default ()=>{
  const onLinkClick = ()=>{
    localStorage.removeItem("secret_mismatch");
  }
  return <div className="invalid-secret-tip">
    <Icon type="warning" theme="filled" className="icon-warn"/>
    {formatMessage({id:"guide.settings.verify_secret.notification.desc"})}
    <Link to="/system/credential" onClick={onLinkClick}> {formatMessage({id:"menu.system.credential"})}&gt;</Link>
  </div>
}