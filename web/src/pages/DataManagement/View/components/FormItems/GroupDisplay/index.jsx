import { Form, Switch } from "antd";
import { useEffect, useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import GroupLabels from "./GroupLabels";

export default (props) => {

    const { form, record } = props;
    const { getFieldDecorator } = form;
    const { is_layered, group_labels = [], series = [] } = record;

    const { metric = {} } = series[0] || {}

    const { groups = [] } = metric

    const [isLayered, setIsLayered] = useState()

    useEffect(() => {
        if (groups.length <= 1) {
            setIsLayered(false)
        } else {
            setIsLayered(is_layered)
        }
    }, [groups.length, is_layered])

    return (
        <>
            {
                groups.length > 1 && (
                    <Form.Item label={formatMessage({id: "dashboard.widget.config.is.layered"})}>
                        {getFieldDecorator("is_layered", {
                            valuePropName: 'checked',
                            initialValue: isLayered || false,
                        })(<Switch size='small' onChange={setIsLayered}/>)}
                    </Form.Item>
                )
            }
            {
                groups.length > 0 && (
                    <Form.Item label={formatMessage({id: "dashboard.widget.config.group.labels"})}>
                        {getFieldDecorator("group_labels", {
                            initialValue: group_labels,
                        })(<GroupLabels isMutiple={isLayered} max={groups.length}/>)}
                    </Form.Item>
                )
            }
        </>
    )
}