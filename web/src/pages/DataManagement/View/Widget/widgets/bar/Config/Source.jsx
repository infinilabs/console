import DataSource from "@/pages/DataManagement/View/components/FormItems/DataSource";
import Groups from "@/pages/DataManagement/View/components/FormItems/Groups";
import MutipleMetrics from "@/pages/DataManagement/View/components/FormItems/MutipleMetrics";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;

    return (
        <>
            <DataSource {...props}/>
            <MutipleMetrics {...props}/>
            <Groups {...props}/>
        </>
    )
}