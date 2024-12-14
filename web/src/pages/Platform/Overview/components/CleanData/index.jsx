import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { Button, Popconfirm } from "antd"
import { useState } from "react";
import { formatMessage } from "umi/locale";

export default (props) => {

    const { status, type, onSuccess } = props;
    const [loading, setLoading] = useState(false)

    const onDelete = async () => {
        setLoading(true)
        const res = await request(`${ESPrefix}/metadata/${type}`, {
            method: 'DELETE'
        })
        if (res?.acknowledged) {
            if (onSuccess) onSuccess()
        }
        setLoading(false)
    }

    return (
        <Popconfirm 
            title={formatMessage({id: "form.button.clean.confim.desc"}, { status })}
            onConfirm={() => onDelete()}
        >
            <Button loading={loading} type="danger">{formatMessage({ id: "form.button.clean"})}</Button>
        </Popconfirm>
    )
}