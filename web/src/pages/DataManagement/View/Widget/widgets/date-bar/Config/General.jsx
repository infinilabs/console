import { Form, InputNumber, Select, Switch } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";
import Format from "@/pages/DataManagement/View/components/FormItems/Format";
import GroupDisplay from "@/pages/DataManagement/View/components/FormItems/GroupDisplay";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;

    const { order, size, is_stack, is_percent } = record;
    
    const [isStack, setIsStack] = useState(is_stack);
    const [showFormatter, setShowFormatter] = useState(!is_percent);

    useEffect(() => {
        setIsStack(is_stack)
    }, [is_stack])

    return (
        <>
            <GroupDisplay {...props}/>
            { showFormatter && <Format {...props}/> }
            <Form.Item label={formatMessage({id: "dashboard.widget.config.general.data.is.stack"})}>
                {getFieldDecorator("is_stack", {
                    valuePropName: 'checked',
                    initialValue: isStack || false,
                })(<Switch size='small' onChange={(checked) => {
                    setIsStack(checked)
                    if (!checked) {
                        form.setFieldsValue({ is_percent: false })
                    }
                }}/>)}
            </Form.Item>
            {
                isStack && (
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
                )
            }
        </>
    )
}