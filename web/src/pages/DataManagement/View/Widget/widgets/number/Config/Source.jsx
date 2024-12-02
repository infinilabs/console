import Groups from "@/pages/DataManagement/View/components/FormItems/Groups";
import SingleMetrics from "@/pages/DataManagement/View/components/FormItems/SingleMetrics";
import DataSource from "@/pages/DataManagement/View/components/FormItems/DataSource";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;

    return (
        <>
            <DataSource {...props}/>
            <SingleMetrics {...props}/>
            <Groups {...props}/>
        </>
    )
}