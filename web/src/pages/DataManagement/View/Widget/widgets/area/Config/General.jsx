import { Form, Switch } from "antd";
import Format from "@/pages/DataManagement/View/components/FormItems/Format";
import { formatMessage } from "umi/locale";
import { useState } from "react";
import GroupDisplay from "@/pages/DataManagement/View/components/FormItems/GroupDisplay";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;

    const { is_percent } = record;
    const [showFormatter, setShowFormatter] = useState(!is_percent);

    return (
        <>
            <GroupDisplay {...props}/>
            { showFormatter && <Format {...props} label={formatMessage({id: "dashboard.widget.config.y.axis"})}/>}
            <Form.Item label={formatMessage({id: "dashboard.widget.config.general.data.is.percent"})}>
                {getFieldDecorator("is_percent", {
                    valuePropName: 'checked',
                    initialValue: is_percent || false,
                })(<Switch size='small' onChange={(checked) => {
                    if (checked) {
                        form.setFieldsValue({ formatter: 'number' })
                        setShowFormatter(false);
                    } else {
                        setShowFormatter(true);
                    }
                }}/>)}
            </Form.Item>
        </>
    )
}