import { Form, InputNumber } from "antd";
import { formatMessage } from "umi/locale";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;
    const { page_size } = record;
    
    return (
        <Form.Item label={formatMessage({id: "dashboard.widget.config.general.page.size"})}>
            {getFieldDecorator("page_size", {
                initialValue: page_size || 20,
            })(<InputNumber style={{ width: 'calc(100% - 24px)' }} min={1} />)}
        </Form.Item>
    )
}