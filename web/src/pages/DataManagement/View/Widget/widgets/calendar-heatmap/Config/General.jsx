import Format from "@/pages/DataManagement/View/components/FormItems/Format";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;

    return (
        <>
            <Format {...props}/>
        </>
    )
}