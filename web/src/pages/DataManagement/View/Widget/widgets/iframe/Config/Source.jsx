import { Form, Input } from "antd";
import { formatMessage } from "umi/locale";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form; 
    const { url } = record;

    return (
        <>
            <Form.Item label={formatMessage({id: 'dashboard.widget.config.external.link'})}>
                {getFieldDecorator("url", {
                    initialValue: url || '',
                })(<Input />)}
            </Form.Item>
        </>
    )
}