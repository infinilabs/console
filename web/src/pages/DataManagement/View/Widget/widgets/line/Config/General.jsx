import Format from "@/pages/DataManagement/View/components/FormItems/Format";
import GroupDisplay from "@/pages/DataManagement/View/components/FormItems/GroupDisplay";
import { formatMessage } from "umi/locale";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;

    return (
        <>
            <GroupDisplay {...props}/>
            <Format {...props} label={formatMessage({id: "dashboard.widget.config.y.axis"})}/>
        </>
    )
}