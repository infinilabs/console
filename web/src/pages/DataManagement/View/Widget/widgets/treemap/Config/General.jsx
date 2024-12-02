import Format from "@/pages/DataManagement/View/components/FormItems/Format";
import GroupDisplay from "@/pages/DataManagement/View/components/FormItems/GroupDisplay";
import { Form, InputNumber, Select } from "antd";
import { formatMessage } from "umi/locale";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;

    const { order, size } = record;

    return (
        <>
            <GroupDisplay {...props}/>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.general.order"})}>
                {getFieldDecorator("order", {
                    initialValue: order || "",
                })(<Select >
                    <Select.Option value="">{formatMessage({id: "dashboard.widget.config.general.order.normal"})}</Select.Option>
                    <Select.Option value="desc">{formatMessage({id: "dashboard.widget.config.general.order.desc"})}</Select.Option>
                    <Select.Option value="asc">{formatMessage({id: "dashboard.widget.config.general.order.asc"})}</Select.Option>
                </Select>)}
            </Form.Item>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.general.size"})}>
                {getFieldDecorator("size", {
                    initialValue: size,
                })(<InputNumber style={{ width: '100%'}} min={0} />)}
            </Form.Item>
            <Format {...props}/>
        </>
    )
}