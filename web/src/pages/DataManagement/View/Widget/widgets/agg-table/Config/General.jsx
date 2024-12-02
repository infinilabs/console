import { Form, Select } from "antd";
import { formatMessage } from "umi/locale";
import Format from "@/pages/DataManagement/View/components/FormItems/Format";
import PageSize from "@/pages/DataManagement/View/components/FormItems/PageSize";
import GroupDisplay from "@/pages/DataManagement/View/components/FormItems/GroupDisplay";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;

    const { bucket_size } = record;
    
    return (
        <>
            <GroupDisplay {...props}/>
            <Format {...props}/>
            <PageSize {...props}/>
        </>
    )
}