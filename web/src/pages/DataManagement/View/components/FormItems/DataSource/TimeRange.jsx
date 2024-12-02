import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { Form, Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import DatePicker from "./DatePicker";
import HideWizard from "../../HideWizard";

export default (props) => {

    const { form, globalQueries, customQueries, isGlobalTimeRange, setIsGlobalTimeRange } = props;

    const { getFieldDecorator } = form;

    const { range } = customQueries;

    return (
        <>
            {getFieldDecorator('isGlobalTimeRange', {
                initialValue: isGlobalTimeRange,
            })(
                <Select onChange={setIsGlobalTimeRange} style={{ width: '100%' }}>
                    <Select.Option value={true}>
                        Use Dashboard's Setting
                    </Select.Option>
                    <Select.Option value={false}>
                        Custom
                    </Select.Option>
                </Select>
            )}
            <HideWizard visible={!isGlobalTimeRange}>
                {getFieldDecorator('range', {
                    initialValue: range || { from: 'now-15m', to: 'now'},
                })(
                    <DatePicker />
                )}
            </HideWizard>
        </>
    )
}