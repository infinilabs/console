import { Form, Select } from "antd";
import { formatMessage } from "umi/locale";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;
    const { bucket_size } = record;

    return (
        <Form.Item 
            label={formatMessage({id: "dashboard.widget.config.source.bucket_size"})}
            help="It will be automatically optimized based on the time range actually"
        >
            {getFieldDecorator(`bucket_size`, {
                initialValue: bucket_size || 'auto',
                rules: [
                    {
                        required: true,
                        message: "Please select bucket size!",
                    }
                ],
            })(<Select 
                placeholder="Please select bucket size" 
                allowClear
                style={{ width: 'calc(100% - 28px)' }} 
            >
                {
                    [
                        { label: 'Auto', key: 'auto'},
                        { label: '10 seconds', key: '10s'},
                        { label: '30 seconds', key: '30s'},
                        { label: '1 minutes', key: '1m'},
                        { label: '5 minutes', key: '5m'},
                        { label: '10 minutes', key: '10m'},
                        { label: '30 minutes', key: '30m'},
                        { label: '1 hours', key: '1h'},
                        { label: '1 days', key: '24h'},
                        { label: '1 weeks', key: '168h'},
                        { label: '1 months', key: '720h'}
                    ].map((item) => (
                        <Select.Option key={item.key}>{item.label}</Select.Option>
                    ))
                }
            </Select>)}
        </Form.Item>
    )
}