import PageSize from "@/pages/DataManagement/View/components/FormItems/PageSize";
import { formatMessage } from "umi/locale";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;
    
    return (
        <>
            <PageSize {...props}/>
        </>
    )
}