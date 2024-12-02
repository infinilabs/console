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
            <Form.Item label={formatMessage({id: "dashboard.widget.config.general.order"})}>
                {getFieldDecorator("order", {
                    initialValue: order || "",
                })(<Select style={{ width: 'calc(100% - 22px)' }} >
                    <Select.Option value="">{formatMessage({id: "dashboard.widget.config.general.order.normal"})}</Select.Option>
                    <Select.Option value="desc">{formatMessage({id: "dashboard.widget.config.general.order.desc"})}</Select.Option>
                    <Select.Option value="asc">{formatMessage({id: "dashboard.widget.config.general.order.asc"})}</Select.Option>
                </Select>)}
            </Form.Item>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.general.size"})}>
                {getFieldDecorator("size", {
                    initialValue: size,
                })(<InputNumber style={{ width: 'calc(100% - 22px)' }} min={0} />)}
            </Form.Item>
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