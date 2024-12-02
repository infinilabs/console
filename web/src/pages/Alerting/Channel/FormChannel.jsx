import request from "@/utils/request";
import { message } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";
import { CHANNELS } from "./Index";

export default (props) => {

    const { value, valueProps = "", form, isAdvanced } = props;

    const [currentChannel, setCurrentChannel] = useState();

    const [loading, setLoading] = useState(false)

    const onTest = async (values) => {
        setLoading(true)
        const saveRes = await request(`/alerting/channel/test`, {
            method: "POST",
            body: values,
        });
        if (saveRes?.acknowledged) {
            message.success(formatMessage({
                id: "app.message.send.success",
            }));
        } else {
            message.error(formatMessage({
                    id: "app.message.send.failed",
            }));
        }
        setLoading(false)
    };

    const handleTest = () => {
        if (props.handleTest) {
            props.handleTest()
            return;
        }
        form.validateFields((err, values) => {
            if (err) {
                return false;
            }
            if (values.sub_type === 'email') {
                values.type = 'email'
                values.webhook = undefined
            } else {
                values.type = 'webhook'
                values.email = undefined
            }

            if(values.type == "webhook"){
                const header_params_obj = {};
                values.webhook?.header_params?.forEach((item) => {
                    if (item.key.length && item.value.length) {
                        header_params_obj[item.key] = item.value;
                    }
                });
                values.webhook.header_params = header_params_obj
            }
            onTest(values)
        });
    }

    useEffect(() => {
        const channelPlugin = CHANNELS.find((c) => c.key === (value?.sub_type || value?.type))
        setCurrentChannel(channelPlugin)
    }, [value?.sub_type, value?.type])

    return (
        currentChannel?.component ? (
            <currentChannel.component 
                form={form} 
                valueProps={valueProps}
                value={value?.[value.type]}
                isAdvanced={isAdvanced}
                handleTest={handleTest}
                testLoading={loading}
            />
        ) : null
    )
}