import NoPermission from "@/components/Icons/NoPermission"
import { Icon } from "antd"
import { SizeMe } from 'react-sizeme';
import AutoFontSizer from "../widgets/number/AutoFontSizer";
import { formatMessage } from "umi/locale";

export default () => {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
            <div style={{ fontSize: 68 }}><Icon component={NoPermission} /></div>
            <div style={{ fontSize: 16, opacity: 0.5 }}>{formatMessage({ id: "dashboard.no.permission" })}</div>
        </div>
    )
}